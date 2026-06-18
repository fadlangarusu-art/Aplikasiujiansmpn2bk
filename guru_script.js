// --- Inisialisasi Firebase ---
const firebaseConfig = {
    apiKey: "AIzaSyBS8wBXqe_OZFRXrWQTP3B93RXxNaZ7vFg",
    authDomain: "aplikasi-ujian-sekolah-smp2bk.firebaseapp.com",
    databaseURL: "https://aplikasi-ujian-sekolah-smp2bk-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "aplikasi-ujian-sekolah-smp2bk",
    storageBucket: "aplikasi-ujian-sekolah-smp2bk.firebasestorage.app",
    messagingSenderId: "422205736440",
    appId: "1:422205736440:web:b291132c904f58ddd3820d",
    measurementId: "G-FRKS6C55ZF"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// --- Deteksi User Login & Ambil Nama Guru ---
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // Ambil 'username' dari email dummy (misal: budi@smpn2bk.local menjadi 'budi')
        const username = user.email.split('@')[0];

        // Tarik data profil dari Realtime Database berdasarkan username
        firebase.database().ref('users/' + username).once('value')
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    // Ubah elemen H2 dengan nama asli guru
                    document.getElementById('welcome-message').innerHTML = `Selamat Datang, ${userData.nama}! 👨‍🏫`;
                } else {
                    document.getElementById('welcome-message').innerHTML = `Selamat Datang, Guru! 👨‍🏫`;
                }
            }).catch((error) => {
                console.error("Gagal mengambil data profil:", error);
                // Tambahkan baris ini agar jika error, UI tidak tersangkut di "Memuat data..."
                document.getElementById('welcome-message').innerHTML = `Selamat Datang, Guru! 👨‍🏫`;
            });

            loadBankSoal(username);
    } else {
        // Keamanan tambahan: Jika ada yang mengakses halaman tanpa login, kembalikan ke form login
        window.location.href = 'index.html';
    }
});

// 1. Fungsi Logout dengan Firebase
function prosesLogout() {
    firebase.auth().signOut().then(() => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error("Gagal melakukan logout:", error);
        alert("Terjadi kesalahan saat logout.");
    });
}

// 2. Fungsi untuk Download QR Code resolusi tinggi untuk di-print
function downloadQR(token) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${token}`;
    
    fetch(qrUrl)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `QRCode_${token}.png`; 
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(() => {
            window.open(qrUrl, '_blank');
        });
}

// 3. Fungsi Universal untuk Membuka Modal
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

// Fungsi Universal untuk Menutup Modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Counter ID untuk baris dinamis komposisi soal
let rowCount = 1;

function tambahTipeSoal() {
    rowCount++;
    const container = document.getElementById('komposisi-container');
    
    const newRow = document.createElement('div');
    newRow.className = 'komposisi-row';
    newRow.id = `row-${rowCount}`;
    
    // Di dalam function tambahTipeSoal()
    newRow.innerHTML = `
        <select class="modal-select" style="flex: 2;" onchange="ubahInputKunci(this)" required>
            <option value="" disabled selected>Pilih Tipe</option>
            <option value="PG">Pilihan Ganda</option>
            <option value="PG Kompleks">PG Kompleks</option>
            <option value="Isian Singkat">Isian Singkat</option>
            <option value="Mencocokkan">Mencocokkan</option>
            <option value="Essay">Essay / Uraian</option>
        </select>
        <input type="text" class="modal-input input-no" placeholder="No (Cth: 21-25)" style="flex: 1.5;" required>
        <select class="modal-select select-metode" style="flex: 1.5; display: none;">
            <option value="Di Kertas">Di Kertas</option>
            <option value="Di Aplikasi">Di Aplikasi</option>
        </select>
        <input type="text" class="modal-input input-kunci" placeholder="Kunci (Tanpa spasi)" style="flex: 3;" oninput="validasiSpasi(this)">
        <input type="number" class="modal-input input-poin-max" placeholder="Poin Max" style="flex: 1; display: none;" min="1" title="Poin Maksimal per Soal">
        <input type="number" class="modal-input input-bobot" placeholder="Bobot %" style="flex: 1.2;" required min="1" max="100">
        <button type="button" class="btn-sm btn-danger" onclick="hapusBaris('row-${rowCount}')" style="padding: 10px;" title="Hapus Baris">❌</button>
    `;
    
    container.appendChild(newRow);
}

// GANTI fungsi hapusBaris yang lama dengan ini:
function hapusBaris(rowId) {
    const container = document.getElementById('komposisi-container');
    if (container.children.length > 1) {
        document.getElementById(rowId).remove();
    } else {
        Swal.fire({
            icon: 'warning',
            title: 'Tidak Bisa Dihapus',
            text: 'Minimal harus ada 1 tipe soal!'
        });
    }
}

// Fungsi untuk mencegah input spasi pada tipe soal tertentu
function validasiSpasi(inputElement) {
    const row = inputElement.parentElement;
    const selectTipe = row.querySelector('select').value;
    
    if (selectTipe === 'PG' || selectTipe === 'PG Kompleks' || selectTipe === 'Mencocokkan') {
        // Hapus semua karakter spasi secara otomatis
        inputElement.value = inputElement.value.replace(/\s/g, '');
    }
}

// Fungsi untuk mengubah petunjuk kunci jawaban sesuai tipe soal
// Fungsi untuk mengubah petunjuk kunci jawaban sesuai tipe soal
function ubahInputKunci(selectElement) {
    const row = selectElement.parentElement;
    const inputKunci = row.querySelector('.input-kunci');
    const selectMetode = row.querySelector('.select-metode'); 
    const inputPoinMax = row.querySelector('.input-poin-max');
    const tipe = selectElement.value;

    inputKunci.required = true;
    inputKunci.disabled = false;
    inputKunci.style.backgroundColor = "#fff"; 
    
    if (selectMetode) {
        selectMetode.style.display = 'none';
    }

    // Tampilkan/Sembunyikan input poin maksimal
    if (inputPoinMax) {
        if (tipe === 'Isian Singkat' || tipe === 'Essay') {
            inputPoinMax.style.display = 'inline-block';
            inputPoinMax.required = true;
            if (!inputPoinMax.value) {
                inputPoinMax.value = '10'; // Default 10 poin
            }
        } else {
            inputPoinMax.style.display = 'none';
            inputPoinMax.required = false;
            inputPoinMax.value = '';
        }
    }

    if(tipe === 'Isian Singkat' || tipe === 'Essay') {
        inputKunci.value = ""; 
        if (selectMetode) {
            selectMetode.style.display = 'inline-block'; 
        }
    } 
    else if (tipe === 'PG' || tipe === 'PG Kompleks' || tipe === 'Mencocokkan') {
        inputKunci.value = inputKunci.value.replace(/\s/g, ''); 
    }

    // Ubah Placeholder (Perhatikan bagian Mencocokkan)
    if (tipe === 'PG') {
        inputKunci.placeholder = "Cth: A,B,C,D...";
    } 
    else if (tipe === 'PG Kompleks') {
        inputKunci.placeholder = "Cth: AC,BD,ABE...";
    } 
    else if (tipe === 'Mencocokkan') {
        // Petunjuk diubah agar guru menggunakan (;) untuk memisah soal
        inputKunci.placeholder = "Cth: 1A,2B; 1C,2D (Pakai ; antar soal)";
    } 
    else if (tipe === 'Isian Singkat' || tipe === 'Essay') {
        inputKunci.placeholder = "Koreksi Manual (Tanpa kunci)";
        inputKunci.required = false; 
        inputKunci.disabled = true;  
        inputKunci.style.backgroundColor = "#f5f5f5"; 
    } 
    else {
        inputKunci.placeholder = "Kunci Jawaban";
    }
}

// --- Fungsi Dinamis untuk Menangani Upload PDF Soal ke Google Drive ---
// PERUBAHAN: Menerima param examId (untuk simpan DB) dan token (untuk nama file)
function triggerUploadPDF(examId, token) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf'; 
    
    fileInput.onchange = e => {
        const file = e.target.files[0];
        
        if (file) {
            if (file.type !== "application/pdf") {
                Swal.fire({
                    icon: 'error',
                    title: 'Format File Salah!',
                    text: 'Harap unggah berkas berformat PDF.',
                    confirmButtonColor: '#764ba2'
                });
                return;
            }
            
            const maxSize = 5 * 1024 * 1024; // 5 MB
            if (file.size > maxSize) {
                Swal.fire({
                    icon: 'warning',
                    title: 'File Terlalu Besar!',
                    text: 'Maksimal ukuran PDF soal adalah 5 MB.',
                    confirmButtonColor: '#764ba2'
                });
                return;
            }

            // Ubah teks tombol menjadi indikator loading dengan referensi examId
            const btnUpload = document.querySelector(`#card-${examId} .btn-upload-pdf`);
            const originalText = btnUpload.innerHTML;
            btnUpload.innerHTML = '⏳ Mengunggah...';
            btnUpload.disabled = true;

            // TAMPILKAN LOADING SWEETALERT2
            Swal.fire({
                title: 'Mengunggah File PDF',
                text: 'Sedang memproses dan mengunggah soal ke Google Drive...',
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const reader = new FileReader();
            reader.onload = function(event) {
                const base64Data = event.target.result.split(',')[1];
                
                const scriptUrl = "https://script.google.com/macros/s/AKfycbx1IXEl7IjqafityTbGs3W8vBk9eJrBWgLO2VNtptVhef8P9Mvq9kpK7eZaIxDFzrjx8g/exec"; 
                
                const formData = new URLSearchParams();
                formData.append('fileName', `${token}_${file.name}`); // Nama file digabung dengan token 
                formData.append('mimeType', file.type);
                formData.append('fileData', base64Data);

                fetch(scriptUrl, {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(result => {
                    if (result.status === 'success') {
                        // PERUBAHAN: Update node database berdasarkan examId
                        firebase.database().ref('ujian/' + examId).update({
                            urlSoalPdf: result.fileId 
                        }).then(() => {
                            
                            // TAMPILKAN NOTIFIKASI SUKSES SWEETALERT2
                            Swal.fire({
                                icon: 'success',
                                title: 'Berhasil!',
                                text: 'Soal PDF berhasil diunggah ke Google Drive.',
                                timer: 2000,
                                showConfirmButton: false
                            });

                            btnUpload.innerHTML = '✅ PDF Diperbarui';
                            btnUpload.disabled = false;
                        });
                    } else {
                        throw new Error(result.message);
                    }
                })
                .catch(error => {
                    console.error("Upload error:", error);
                    
                    // TAMPILKAN NOTIFIKASI ERROR SWEETALERT2
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal Mengunggah',
                        text: 'Silakan coba lagi. Error: ' + error.message,
                        confirmButtonColor: '#764ba2'
                    });

                    btnUpload.innerHTML = originalText;
                    btnUpload.disabled = false;
                });
            };

            reader.readAsDataURL(file);
        }
    };
    
    fileInput.click();
}

// --- Fungsi Menampilkan/Menyembunyikan Pilihan Agama ---
function toggleAgama(tipe) {
    const groupAgama = document.getElementById('group-agama');
    const selectAgama = document.getElementById('select-agama');

    if (tipe === 'Agama') {
        // Tampilkan form dan jadikan wajib diisi (required)
        groupAgama.style.display = 'flex'; 
        selectAgama.required = true;
    } else {
        // Sembunyikan form, hapus required, dan reset nilainya
        groupAgama.style.display = 'none';
        selectAgama.required = false;
        selectAgama.value = ""; 
    }
}

// --- Fungsi Memuat Data Kelas Dinamis dari Firebase ---
// --- Fungsi Memuat Data Kelas Dinamis dari Firebase (Mode Checkbox) ---
function loadDataKelas() {
    const containerKelas = document.getElementById('container-kelas');
    if (!containerKelas) return;

    firebase.database().ref('users').on('value', (snapshot) => {
        // Reset container
        containerKelas.innerHTML = '';

        if (snapshot.exists()) {
            const setKelas = new Set(); // Menggunakan Set agar nama kelas tidak duplikat

            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                if (data.role === 'siswa' && data.kelas) {
                    setKelas.add(data.kelas);
                }
            });

            // Urutkan nama kelas secara alfabetis (A-Z)
            const listKelas = Array.from(setKelas).sort();

            if (listKelas.length === 0) {
                containerKelas.innerHTML = '<span style="color: #888; font-size: 13px;">Belum ada data siswa terdaftar</span>';
                return;
            }

            // Buat checkbox untuk setiap kelas
            listKelas.forEach((namaKelas) => {
                const div = document.createElement('div');
                div.style.marginBottom = '6px';
                div.innerHTML = `
                    <label style="display: flex; align-items: center; gap: 8px; font-weight: normal; cursor: pointer; font-size: 13px; color: #333; margin: 0;">
                        <input type="checkbox" name="kelas-sasaran" value="${namaKelas}" style="cursor: pointer; width: 16px; height: 16px;">
                        ${namaKelas}
                    </label>
                `;
                containerKelas.appendChild(div);
            });
        } else {
            containerKelas.innerHTML = '<span style="color: #888; font-size: 13px;">Belum ada data siswa terdaftar</span>';
        }
    });
}

// --- Pastikan fungsi loadDataKelas dipanggil saat halaman selesai dimuat ---
window.addEventListener('DOMContentLoaded', () => {
    loadDataKelas();
});

// --- Fungsi Membuat Token Acak 5 Karakter (Contoh: KOYKY) ---
function generateToken() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// --- Fungsi Menyimpan Data Ujian ke Kategori 'ujian' ---
// --- Fungsi Menyimpan Data Ujian ke Kategori 'ujian' ---
// --- Fungsi Menyimpan Data Ujian Multi-Kelas ke Kategori 'ujian' ---
function simpanUjian(event) {
    event.preventDefault();

    // 1. Ambil SEMUA checkbox kelas yang dicentang
    const checkboxesKelas = document.querySelectorAll('input[name="kelas-sasaran"]:checked');
    if (checkboxesKelas.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Kelas Belum Dipilih',
            text: 'Silakan pilih minimal 1 kelas sasaran!',
            confirmButtonColor: '#764ba2'
        });
        return; // Hentikan proses jika tidak ada kelas yang dipilih
    }

    // 2. Ambil nilai dasar dari Element HTML
    const mapel = document.getElementById('input-mapel').value;
    const tipeUjian = document.getElementById('select-tipe-ujian').value;
    const agama = document.getElementById('select-agama').value;
    
    const waktuMulaiRaw = document.getElementById('input-waktu-mulai').value;
    const waktuSelesaiRaw = document.getElementById('input-waktu-selesai').value;
    const waktuMulai = new Date(waktuMulaiRaw).getTime();
    const waktuSelesai = new Date(waktuSelesaiRaw).getTime();

    if (waktuMulai >= waktuSelesai) {
        Swal.fire({
            icon: 'error',
            title: 'Pengaturan Waktu Salah',
            text: 'Waktu selesai harus lebih lambat dari waktu mulai!',
            confirmButtonColor: '#764ba2'
        });
        return;
    }

    // 3. Ambil data komposisi & kunci jawaban
    const komposisiContainer = document.getElementById('komposisi-container');
    const rows = komposisiContainer.getElementsByClassName('komposisi-row');
    let komposisiSoal = {};

    // (Cari bagian ini di dalam simpanUjian dan ubah strukturnya)
    for (let i = 0; i < rows.length; i++) {
        const selectTipe = rows[i].querySelector('select').value;
        const inputNo = rows[i].querySelector('.input-no').value; 
        const selectMetode = rows[i].querySelector('.select-metode').value;
        const inputKunci = rows[i].querySelector('.input-kunci').value; 
        const inputPoinMax = rows[i].querySelector('.input-poin-max').value;
        const inputBobot = rows[i].querySelector('.input-bobot').value;

        let kunciBersih = inputKunci ? inputKunci : "-";
        if (selectTipe === 'PG' || selectTipe === 'PG Kompleks' || selectTipe === 'Mencocokkan') {
            kunciBersih = kunciBersih.replace(/\s/g, ''); 
        }

        komposisiSoal[`bagian_${i + 1}`] = {
            tipe: selectTipe,
            nomor: inputNo,
            kunci: kunciBersih,
            bobot: Number(inputBobot),
            // Jika essay/isian, simpan metode. Jika tidak, abaikan.
            metode: (selectTipe === 'Isian Singkat' || selectTipe === 'Essay') ? selectMetode : "Di Aplikasi",
            // Simpan poin maksimal hanya untuk Isian Singkat dan Essay
            poinMax: (selectTipe === 'Isian Singkat' || selectTipe === 'Essay') ? Number(inputPoinMax) : null
        };
    }

    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        Swal.fire({
            icon: 'error',
            title: 'Sesi Berakhir',
            text: 'Sesi login berakhir. Silakan login kembali.',
            confirmButtonColor: '#764ba2'
        });
        return;
    }
    const usernameGuru = currentUser.email.split('@')[0];

    // TAMPILKAN LOADING MODERN & SMOOTH SEBELUM PROSES FIREBASE DIMULAI
    Swal.fire({
        title: 'Membuat Jadwal Ujian',
        text: 'Sedang memproses data dan menghasilkan token kelas...',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    firebase.database().ref('users/' + usernameGuru).once('value').then((snapshot) => {
        let namaGuru = "Nama Guru";
        if (snapshot.exists()) {
            namaGuru = snapshot.val().nama || "Nama Guru";
        }

        // 4. Siapkan array untuk menampung proses penyimpanan (Promise) dan daftar token
        const simpanPromises = [];
        const tokenList = []; // Untuk ditampilkan di pesan sukses

        // 5. LOOPING: Buat data & simpan untuk setiap kelas yang dipilih
        checkboxesKelas.forEach((checkbox) => {
            const tokenBaru = generateToken(); // Token unik per kelas
            const namaKelasDipilih = checkbox.value;
            
            tokenList.push(`- Kelas ${namaKelasDipilih}: ${tokenBaru}`);

            const dataUjian = {
                token: tokenBaru,
                namaMapel: mapel,
                kelas: namaKelasDipilih, // Disimpan sesuai kelas yang sedang di-looping
                tipeUjian: tipeUjian,
                agama: tipeUjian === 'Agama' ? agama : "",
                namaGuru: namaGuru,
                usernameGuru: usernameGuru,
                waktuMulai: waktuMulai,
                waktuSelesai: waktuSelesai,
                urlSoalPdf: "", 
                komposisiSoal: komposisiSoal
            };

            // Push ke firebase dan masukkan ke dalam antrean promise
            simpanPromises.push(firebase.database().ref('ujian').push(dataUjian));
        });

        // 6. Jalankan semua proses simpan secara bersamaan
        return Promise.all(simpanPromises).then(() => {
            return tokenList;
        });
    })
    .then((tokenList) => {
        
        // TAMPILKAN NOTIFIKASI BERHASIL DENGAN DAFTAR TOKEN BERWARNA DI DALAM BOX MODERN
        Swal.fire({
            icon: 'success',
            title: `Berhasil Membuat ${tokenList.length} Jadwal Ujian!`,
            html: `<p style="margin-bottom: 10px; font-size: 14px;">Silakan bagikan token berikut ke siswa:</p>
                   <div style="text-align: left; background: #f4f6f9; padding: 15px; border-radius: 10px; font-size: 14px; max-height: 180px; overflow-y: auto; border: 1px solid #e1e8ed; line-height: 1.6;">
                        ${tokenList.join('<br>')}
                   </div>`,
            confirmButtonText: 'Selesai & Tutup',
            confirmButtonColor: '#764ba2'
        });

        // Reset Form & UI
        document.getElementById('formTambahUjian').reset();
        if (typeof toggleAgama === "function") toggleAgama('');
        
        document.getElementById('komposisi-container').innerHTML = '';
        if (typeof rowCount !== 'undefined') rowCount = 0;
        if (typeof tambahTipeSoal === "function") tambahTipeSoal();
        
        // Uncheck semua checkbox secara manual (jika form.reset tidak bekerja pada div dinamis)
        document.querySelectorAll('input[name="kelas-sasaran"]').forEach(cb => cb.checked = false);

        closeModal('addExamModal');
    })
    .catch((error) => {
        Swal.fire({
            icon: 'error',
            title: 'Proses Gagal',
            text: 'Gagal menyimpan data ke database: ' + error.message,
            confirmButtonColor: '#764ba2'
        });
    });
}

// --- Fungsi Mengonversi Timestamp ke Format Tanggal Indonesia ---
function formatTanggalIndo(timestamp) {
    if (!timestamp) return "-";
    const opsi = { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return new Date(timestamp).toLocaleDateString('id-ID', opsi).replace('.', ':');
}

// --- Fungsi Memuat Data Bank Soal SPESIFIK Berdasarkan Akun Guru yang Login ---
// --- Fungsi Memuat Data Bank Soal SPESIFIK Berdasarkan Akun Guru yang Login ---
function loadBankSoal(usernameLogin) {
    const examContainer = document.getElementById('exam-container');
    if (!examContainer) return;

    examContainer.innerHTML = '<p style="color: #666; font-style: italic;">Memuat data bank soal Anda...</p>';

    firebase.database().ref('ujian')
        .orderByChild('usernameGuru')
        .equalTo(usernameLogin)
        .on('value', (snapshot) => {
            
            examContainer.innerHTML = ''; 

            if (!snapshot.exists()) {
                examContainer.innerHTML = '<p style="color: #888; text-align: center; grid-column: 1/-1;">Anda belum membuat bank soal atau jadwal ujian.</p>';
                return;
            }

            snapshot.forEach((childSnapshot) => {
                const examId = childSnapshot.key; // PERUBAHAN: Sekarang key-nya adalah ID Acak
                const data = childSnapshot.val();
                const token = data.token; // PERUBAHAN: Token diambil dari dalam datanya

                let totalSoal = 0;
                let detailKomposisiHtml = '';
                
                if (data.komposisiSoal) {
                    Object.keys(data.komposisiSoal).forEach((key) => {
                        const bag = data.komposisiSoal[key];
                        if (bag.nomor && bag.nomor.includes('-')) {
                            const rentang = bag.nomor.split('-');
                            const awal = parseInt(rentang[0]);
                            const akhir = parseInt(rentang[1]);
                            if (!isNaN(awal) && !isNaN(akhir)) {
                                totalSoal += (akhir - awal + 1);
                            }
                        } else if (!isNaN(parseInt(bag.nomor))) {
                            totalSoal += 1;
                        }
                        
                        // Cek apakah ada informasi metode pengerjaan (Untuk Essay/Isian)
                        let infoTambahan = "";
                        if ((bag.tipe === 'Isian Singkat' || bag.tipe === 'Essay') && bag.metode) {
                            infoTambahan = ` <span style="color: #007bff;">(${bag.metode})</span>`;
                        }
                        
                        detailKomposisiHtml += `<li>📌 ${bag.tipe}${infoTambahan} (No: ${bag.nomor})</li>`;
                    });
                }

                const badgeTipe = data.tipeUjian === 'Agama' || data.tipeUjian === 'agama'
                    ? `<span class="badge badge-religion">🕌 Agama (${data.agama || 'Umum'})</span>`
                    : `<span class="badge badge-general">📝 Umum</span>`;

                const statusPdf = data.urlSoalPdf 
                    ? `<span style="color: #28a745; font-size: 12px; font-weight: 500;">✅ PDF Tersedia</span>` 
                    : `<span style="color: #dc3545; font-size: 12px; font-weight: 500;">❌ PDF Belum Diunggah</span>`;

                // PERUBAHAN: card pakai ID acak, tombol edit/hapus pakai ID acak
                const cardHtml = `
                    <div class="exam-card glass-panel" id="card-${examId}">
                        <div class="exam-card-header">
                            <div>
                                <h3 class="exam-title">${data.namaMapel || 'Mata Pelajaran'}</h3>
                                <p class="exam-meta">Target Kelas: <strong>${data.kelas || '-'}</strong></p>
                            </div>
                            <div class="token-display" title="Klik untuk menyalin token" onclick="salinToken('${token}')">
                                <small>TOKEN</small>
                                <span>${token}</span>
                            </div>
                        </div>

                        <div class="exam-card-body">
                            <div style="margin-bottom: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                                ${badgeTipe}
                                <span class="badge badge-count">🔢 ${totalSoal} Soal</span>
                            </div>
                            
                            <div class="komposisi-mini-list">
                                <ul style="list-style: none; padding: 0; margin: 0 0 12px 0; font-size: 12px; color: #555;">
                                    ${detailKomposisiHtml}
                                </ul>
                            </div>

                            <div class="exam-schedule">
                                <p>📅 <strong>Mulai:</strong> ${formatTanggalIndo(data.waktuMulai)}</p>
                                <p>⌛ <strong>Selesai:</strong> ${formatTanggalIndo(data.waktuSelesai)}</p>
                            </div>
                            
                            <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                                <small style="color: #777;">Oleh: ${data.namaGuru || 'Guru'}</small>
                                ${statusPdf}
                            </div>
                        </div>

                        <div class="exam-card-footer" style="margin-top: 15px; display: flex; gap: 8px; flex-direction: column;">
                            <button class="btn-sm btn-upload-pdf" onclick="triggerUploadPDF('${examId}', '${token}')">
                                📁 ${data.urlSoalPdf ? 'Perbarui PDF Soal' : 'Upload PDF Soal'}
                            </button>
                            
                            <button class="btn-sm btn-qr" onclick="downloadQR('${data.token}', '${data.namaMapel}', '${data.kelas}')">🔲 Download QR</button>

                            <div style="display: flex; gap: 8px; width: 100%;">
                                <button class="btn-sm btn-info" style="flex: 1; justify-content: center; padding: 8px;" onclick="bukaModalEdit('${examId}')">
                                    ✏️ Edit
                                </button>
                                <button class="btn-sm btn-danger" style="flex: 1; justify-content: center; padding: 8px;" onclick="hapusUjian('${examId}')">
                                    🗑️ Hapus
                                </button>
                                <button class="btn-sm btn-success" style="width: 100%; justify-content: center; padding: 8px; display: flex; align-items: center; gap: 5px; margin-top: 4px;" onclick="bukaModalHasil('${examId}')">
                                    📊 Lihat Hasil Ujian
                                </button>
                                <button class="btn-sm btn-primary" style="flex: 1; justify-content: center; padding: 8px; display: flex; align-items: center; gap: 5px;" onclick="downloadExcelHasil('${examId}', '${data.namaMapel}', '${data.kelas}')">
                                    ⬇️ Excel
                                </button>
                            </div>
                        </div>
                    </div>
                `;

                examContainer.insertAdjacentHTML('beforeend', cardHtml);
            });
        });
}

// --- Fungsi Pembantu untuk Menyalin Token Saat Card Diklik ---
function salinToken(token) {
    navigator.clipboard.writeText(token).then(() => {
        alert(`Token ${token} berhasil disalin ke clipboard!`);
    }).catch(err => {
        console.error('Gagal menyalin token: ', err);
    });
}


function hapusUjian(idUjian) {
    // 1. TAMPILKAN KONFIRMASI MODERN SEBELUM MENGHAPUS
    Swal.fire({
        title: 'Apakah Anda yakin?',
        text: "Jadwal ujian ini, data seluruh jawaban siswa, dan File PDF soal di Drive akan ikut terhapus secara permanen!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33', // Warna merah untuk tombol hapus/aksi berbahaya
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus Semua!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            
            // 2. TAMPILKAN LOADING MODERN & SMOOTH SELAMA PROSES PEMBERSIHAN BERJALAN
            Swal.fire({
                title: 'Menghapus Data',
                text: 'Sedang membersihkan database dan file Drive, mohon tunggu...',
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const ujianRef = firebase.database().ref('ujian/' + idUjian);
            const jawabanRef = firebase.database().ref('jawaban_ujian/' + idUjian); // Referensi ke data jawaban siswa

            // 3. Baca data ujian terlebih dahulu untuk mendapatkan ID File PDF
            ujianRef.once('value').then((snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const fileId = data.urlSoalPdf; // Kolom yang menyimpan ID File dari Apps Script

                    // 4. Jika ada file PDF-nya, suruh Apps Script menghapusnya secara background
                    if (fileId && fileId.trim() !== "") {
                        const scriptURL = "https://script.google.com/macros/s/AKfycbx1IXEl7IjqafityTbGs3W8vBk9eJrBWgLO2VNtptVhef8P9Mvq9kpK7eZaIxDFzrjx8g/exec"; 
                        
                        const formData = new FormData();
                        formData.append("action", "delete");
                        formData.append("fileId", fileId);

                        // Kirim perintah ke Drive secara background
                        fetch(scriptURL, { method: 'POST', body: formData })
                            .then(response => response.json())
                            .then(res => console.log("Respon Drive:", res))
                            .catch(err => console.error("Gagal menghapus di Drive:", err));
                    }

                    // 5. Lanjutkan menghapus data ujian dari Firebase
                    return ujianRef.remove();
                }
            })
            .then(() => {
                // 6. SETELAH jadwal ujian terhapus, hapus juga SELURUH jawaban siswa terkait
                return jawabanRef.remove();
            })
            .then(() => {
                // 7. TAMPILKAN NOTIFIKASI SUKSES YANG MODERN & SMOOTH (Otomatis Hilang)
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil Dihapus!',
                    text: 'Jadwal Ujian, jawaban siswa, dan file terkait berhasil dibersihkan.',
                    timer: 2000,
                    showConfirmButton: false
                });
            })
            .catch((error) => {
                // TAMPILKAN JIKA TERJADI KESALAHAN SISTEM
                Swal.fire({
                    icon: 'error',
                    title: 'Terjadi Kesalahan',
                    text: 'Gagal menghapus data: ' + error.message,
                    confirmButtonColor: '#764ba2'
                });
            });
        }
    });
}

// --- Fungsi Membuat & Mengunduh QR Code Token (Custom JPG) Tanpa Token ---
function downloadQR(token, mapel, kelas) {
    // Jika data kelas kosong (untuk mencegah error)
    kelas = kelas || "Tidak Diketahui";

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${token}&margin=20`;
    console.log(`Mempersiapkan QR Code kustom untuk: ${token}...`);

    fetch(qrUrl)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const img = new Image();
            
            img.onload = function() {
                // 1. Buat Canvas Virtual
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Set Ukuran Canvas (Lebar 500px, Tinggi disesuaikan menjadi 610px agar pas)
                canvas.width = 500;
                canvas.height = 610; 
                
                // 2. Beri Background Putih
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // 3. Tempelkan Gambar QR Code
                ctx.drawImage(img, 0, 0, 500, 500);
                
                // 4. Pengaturan Teks
                ctx.textAlign = "center";
                ctx.fillStyle = "#000000";
                
                // 5. Tulis Mata Pelajaran
                ctx.font = "bold 32px 'Poppins', Arial, sans-serif";
                ctx.fillText(mapel.toUpperCase(), 250, 540); 
                
                // 6. Tulis Kelas
                ctx.font = "bold 26px 'Poppins', Arial, sans-serif";
                ctx.fillText("KELAS " + kelas.toUpperCase(), 250, 580);
                
                // --- BAGIAN TEKS TOKEN SUDAH DIHAPUS DI SINI ---

                // 7. Konversi Canvas ke JPG dan Eksekusi Download
                const a = document.createElement('a');
                // Bersihkan nama file
                const namaFileAman = `QR_${mapel}_${kelas}`.replace(/[^a-zA-Z0-9]/g, "_");
                a.download = `${namaFileAman}.jpg`;
                a.href = canvas.toDataURL("image/jpeg", 1.0); // Kualitas 100%
                
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                // Bersihkan memori
                window.URL.revokeObjectURL(url); 
            };
            img.src = url;
        })
        .catch(error => {
            alert("Terjadi kesalahan saat memproses gambar QR Code.");
            console.error(error);
        });
}

// --- Fungsi Mencari/Filter Jadwal Ujian Berdasarkan Kelas ---
function cariKelas() {
    // 1. Ambil kata kunci pencarian dari input dan ubah ke huruf kecil
    const inputPencarian = document.getElementById('input-cari-kelas').value.toLowerCase();
    
    // 2. Ambil semua elemen kartu ujian (exam-card) yang sedang tampil di layar
    const kartuUjian = document.getElementsByClassName('exam-card');

    // 3. Lakukan perulangan untuk mengecek setiap kartu satu per satu
    for (let i = 0; i < kartuUjian.length; i++) {
        // Cari elemen yang menyimpan teks informasi kelas di dalam kartu tersebut
        // Di fungsi loadBankSoal, kelas disimpan di dalam tag <p class="exam-meta"> -> <strong>
        const infoKelas = kartuUjian[i].querySelector('.exam-meta strong');

        if (infoKelas) {
            // Ambil teks nama kelasnya (misal: "7A" atau "X IPA 1")
            const teksKelas = infoKelas.textContent || infoKelas.innerText;
            
            // Cocokkan teks kelas dengan kata kunci pencarian
            if (teksKelas.toLowerCase().indexOf(inputPencarian) > -1) {
                // Jika cocok, tampilkan kartu (kembalikan style display ke aslinya)
                kartuUjian[i].style.display = ""; 
            } else {
                // Jika tidak cocok, sembunyikan kartu
                kartuUjian[i].style.display = "none"; 
            }
        }
    }
}


// --- Fungsi Helper untuk Format Datetime-Local ---
function formatToDatetimeLocal(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}

// --- Fungsi Menampilkan Input Agama di Modal Edit ---
function toggleEditAgama(tipe) {
    const groupAgama = document.getElementById('edit-group-agama');
    if (tipe === 'Agama' || tipe === 'agama') {
        groupAgama.style.display = 'flex';
    } else {
        groupAgama.style.display = 'none';
    }
}

// --- Fungsi Membuka Modal Hasil Ujian & Menarik Data Jawaban + Nama Siswa ---
function bukaModalHasil(examId) {
    const tbody = document.getElementById('table-hasil-body');
    // colspan diubah jadi 6 karena kita menambah kolom Nilai
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #888; padding: 20px;">🔄 Sedang memuat dan memproses data hasil ujian...</td></tr>';
    
    openModal('viewResultsModal');

    // 1. Ambil data spesifikasi ujian terlebih dahulu untuk mengecek tipe soal
    firebase.database().ref('ujian/' + examId).once('value').then((ujianSnap) => {
        let butuhKoreksiManual = false;
        
        if (ujianSnap.exists()) {
            const dataUjian = ujianSnap.val();
            // Cek apakah di komposisi soal terdapat Essay atau Isian Singkat
            if (dataUjian.komposisiSoal) {
                Object.keys(dataUjian.komposisiSoal).forEach(key => {
                    const tipe = dataUjian.komposisiSoal[key].tipe;
                    if (tipe === 'Isian Singkat' || tipe === 'Essay') {
                        butuhKoreksiManual = true;
                    }
                });
            }
        }

        // 2. Lanjut mengambil data jawaban ujian dari siswa
        return firebase.database().ref('jawaban_ujian/' + examId).once('value').then(async (snapshot) => {
            tbody.innerHTML = ''; 
            
            if (!snapshot.exists()) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #888; padding: 30px;">Belum ada siswa yang mengumpulkan jawaban untuk ujian ini.</td></tr>';
                return;
            }

            let no = 1;
            let dataJawaban = [];
            snapshot.forEach((childSnapshot) => {
                dataJawaban.push({
                    nisn: childSnapshot.key,
                    rawData: childSnapshot.val()
                });
            });

            // Lakukan perulangan untuk mengambil nama berdasarkan NISN
            for (let i = 0; i < dataJawaban.length; i++) {
                const item = dataJawaban[i];
                const nisn = item.nisn;
                const rawData = item.rawData;

                // Urai Data Jawaban, Status & Nilai Akhir
                let status = "-";
                let jawaban = "-";
                let nilaiTampil = "Belum Koreksi"; // Default jika nilai belum ada
                let warnaNilai = "#777";

                if (typeof rawData === 'string') {
                    try {
                        const parsedData = JSON.parse(rawData);
                        status = parsedData.status || "SELESAI";
                        
                        if (parsedData.nilaiAkhir !== undefined) {
                            nilaiTampil = parsedData.nilaiAkhir;
                            warnaNilai = "#2e7d32"; 
                        }
                        
                        if (parsedData.rekapJawaban) {
                            let rekapHtml = [];
                            for (const [tipe, rekapan] of Object.entries(parsedData.rekapJawaban)) {
                                rekapHtml.push(`<div style="margin-bottom: 4px;"><span style="color:#1976d2; font-weight:600;">${tipe}:</span> ${rekapan}</div>`);
                            }
                            jawaban = rekapHtml.join('');
                        } else if (parsedData.jawabanList) {
                            jawaban = parsedData.jawabanList.join(', ');
                        }
                    } catch (e) {
                        if (rawData.includes('|')) {
                            const parts = rawData.split('|');
                            status = parts[0].trim();
                            jawaban = parts[1].replace(/jawaban:/i, '').trim();
                        } else {
                            if (rawData.toLowerCase().includes('jawaban:')) {
                                jawaban = rawData.replace(/jawaban:/i, '').trim();
                            } else {
                                status = rawData;
                            }
                        }
                    }
                } else if (typeof rawData === 'object' && rawData !== null) {
                    status = rawData.status || "SELESAI";
                    
                    if (rawData.nilaiAkhir !== undefined) {
                        nilaiTampil = rawData.nilaiAkhir;
                        warnaNilai = "#2e7d32"; 
                    }

                    if (rawData.rekapJawaban) {
                        let rekapHtml = [];
                        for (const [tipe, rekapan] of Object.entries(rawData.rekapJawaban)) {
                            rekapHtml.push(`<div style="margin-bottom: 4px;"><span style="color:#1976d2; font-weight:600;">${tipe}:</span> ${rekapan}</div>`);
                        }
                        jawaban = rekapHtml.join('');
                    } else if (rawData.jawabanList) {
                        jawaban = rawData.jawabanList.join(', ');
                    }
                }

                // Tentukan Desain Badge Status
                let statusHtml = `<span class="badge-status status-active">Selesai Normal</span>`;
                if (status.toUpperCase().includes('DISKUALIFIKASI')) {
                    statusHtml = `<span class="badge-status" style="background: #ffebee; color: #d32f2f; border: 1px solid #ffcdd2; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 11px;">⚠️ ${status}</span>`;
                } else if (status !== "-" && status !== "") {
                    statusHtml = `<span class="badge-status status-pending">${status}</span>`;
                }

                // AMBIL NAMA SISWA DARI TABEL 'users' BERDASARKAN NISN
                let namaSiswaTampil = nisn;
                try {
                    const userSnap = await firebase.database().ref('users/' + nisn).once('value');
                    if (userSnap.exists()) {
                        const dataUser = userSnap.val();
                        if (dataUser && dataUser.nama) {
                            namaSiswaTampil = dataUser.nama;
                        }
                    }
                } catch (error) {
                    console.error("Gagal mengambil nama siswa untuk NISN " + nisn, error);
                }

                // --- MODIFIKASI: Kondisikan tombol koreksi ---
                let tombolKoreksiHtml = '';
                if (butuhKoreksiManual) {
                    tombolKoreksiHtml = `
                        <button class="btn-sm btn-info" style="padding: 6px; font-size: 12px; width: 100%; justify-content: center;" onclick="bukaKoreksi('${examId}', '${nisn}')">
                            ✍️ Koreksi
                        </button>
                    `;
                }
                // ---------------------------------------------

                // Susun Baris Tabel HTML
                const rowHtml = `
                    <tr>
                        <td style="text-align: center; font-weight: 500;">${no++}</td>
                        <td>
                            <div style="font-weight: 600; color: #1976d2;">${namaSiswaTampil}</div>
                            <div style="font-size: 11px; color: #888;">NISN: ${nisn}</div>
                        </td>
                        <td>${statusHtml}</td>
                        <td style="text-align: center; font-weight: bold; font-size: 15px; color: ${warnaNilai};">
                            ${nilaiTampil}
                        </td>
                        <td style="font-family: 'Courier New', monospace; font-size: 13px; background: #fdfdfd; word-break: break-all; letter-spacing: 0.5px;">
                            ${jawaban}
                        </td>
                        <td style="text-align: center;">
                            <div style="display: flex; flex-direction: column; gap: 5px;">
                                ${tombolKoreksiHtml}
                                <button class="btn-sm btn-danger" style="padding: 6px; font-size: 12px; width: 100%; justify-content: center;" onclick="resetUjianSiswa('${examId}', '${nisn}')">
                                    🔄 Reset
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
                tbody.insertAdjacentHTML('beforeend', rowHtml);
            }
        });
    }).catch((error) => {
        console.error("Gagal mengambil hasil ujian:", error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #d32f2f; padding: 20px;">❌ Gagal memuat data dari server.</td></tr>';
    });
}

// --- Fungsi Menyimpan Perubahan ke Firebase ---
function simpanEditUjian(event) {
    event.preventDefault();

    const examId = document.getElementById('edit-exam-id').value;
    const mapel = document.getElementById('edit-input-mapel').value;
    const tipeUjian = document.getElementById('edit-select-tipe-ujian').value;
    const agama = document.getElementById('edit-select-agama').value;
    
    const waktuMulaiRaw = document.getElementById('edit-input-waktu-mulai').value;
    const waktuSelesaiRaw = document.getElementById('edit-input-waktu-selesai').value;
    const waktuMulai = new Date(waktuMulaiRaw).getTime();
    const waktuSelesai = new Date(waktuSelesaiRaw).getTime();

    if (waktuMulai >= waktuSelesai) {
        alert("Waktu selesai harus lebih lambat dari waktu mulai!");
        return;
    }

    // Hanya update properti yang ada di form
    const dataUpdate = {
        namaMapel: mapel,
        tipeUjian: tipeUjian,
        agama: tipeUjian === 'Agama' ? agama : "",
        waktuMulai: waktuMulai,
        waktuSelesai: waktuSelesai
    };

    const btnSimpan = document.querySelector('#formEditUjian button[type="submit"]');
    btnSimpan.innerHTML = "Menyimpan...";
    btnSimpan.disabled = true;

    firebase.database().ref('ujian/' + examId).update(dataUpdate)
        .then(() => {
            alert("✅ Berhasil memperbarui data ujian!");
            closeModal('editExamModal');
        })
        .catch((error) => {
            alert("❌ Gagal memperbarui data: " + error.message);
        })
        .finally(() => {
            btnSimpan.innerHTML = "Simpan Perubahan";
            btnSimpan.disabled = false;
        });
}

// --- Fungsi Membuka Modal Hasil Ujian & Menarik Data Jawaban + Nama Siswa ---
function bukaModalHasil(examId) {
    const tbody = document.getElementById('table-hasil-body');
    // colspan diubah jadi 6 karena kita menambah kolom Nilai
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #888; padding: 20px;">🔄 Sedang memuat dan memproses data hasil ujian...</td></tr>';
    
    openModal('viewResultsModal');

    // 1. Ambil data spesifikasi ujian terlebih dahulu untuk mengecek tipe soal
    firebase.database().ref('ujian/' + examId).once('value').then((ujianSnap) => {
        let butuhKoreksiManual = false;
        
        if (ujianSnap.exists()) {
            const dataUjian = ujianSnap.val();
            // Cek apakah di komposisi soal terdapat Essay atau Isian Singkat
            if (dataUjian.komposisiSoal) {
                Object.keys(dataUjian.komposisiSoal).forEach(key => {
                    const tipe = dataUjian.komposisiSoal[key].tipe;
                    if (tipe === 'Isian Singkat' || tipe === 'Essay') {
                        butuhKoreksiManual = true;
                    }
                });
            }
        }

        // 2. Lanjut mengambil data jawaban ujian dari siswa
        return firebase.database().ref('jawaban_ujian/' + examId).once('value').then(async (snapshot) => {
            tbody.innerHTML = ''; 
            
            if (!snapshot.exists()) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #888; padding: 30px;">Belum ada siswa yang mengumpulkan jawaban untuk ujian ini.</td></tr>';
                return;
            }

            let no = 1;
            let dataJawaban = [];
            snapshot.forEach((childSnapshot) => {
                dataJawaban.push({
                    nisn: childSnapshot.key,
                    rawData: childSnapshot.val()
                });
            });

            // Lakukan perulangan untuk mengambil nama berdasarkan NISN
            for (let i = 0; i < dataJawaban.length; i++) {
                const item = dataJawaban[i];
                const nisn = item.nisn;
                const rawData = item.rawData;

                // Urai Data Jawaban, Status & Nilai Akhir
                let status = "-";
                let jawaban = "-";
                let nilaiTampil = "Belum Koreksi"; 
                let warnaNilai = "#777";

                if (typeof rawData === 'string') {
                    try {
                        const parsedData = JSON.parse(rawData);
                        status = parsedData.status || "SELESAI";
                        
                        if (parsedData.nilaiAkhir !== undefined) {
                            nilaiTampil = parsedData.nilaiAkhir;
                            warnaNilai = "#2e7d32"; 
                        }
                        
                        if (parsedData.rekapJawaban) {
                            let rekapHtml = [];
                            for (const [tipe, rekapan] of Object.entries(parsedData.rekapJawaban)) {
                                rekapHtml.push(`<div style="margin-bottom: 4px;"><span style="color:#1976d2; font-weight:600;">${tipe}:</span> ${rekapan}</div>`);
                            }
                            jawaban = rekapHtml.join('');
                        } else if (parsedData.jawabanList) {
                            jawaban = parsedData.jawabanList.join(', ');
                        }
                    } catch (e) {
                        if (rawData.includes('|')) {
                            const parts = rawData.split('|');
                            status = parts[0].trim();
                            jawaban = parts[1].replace(/jawaban:/i, '').trim();
                        } else {
                            if (rawData.toLowerCase().includes('jawaban:')) {
                                jawaban = rawData.replace(/jawaban:/i, '').trim();
                            } else {
                                status = rawData;
                            }
                        }
                    }
                } else if (typeof rawData === 'object' && rawData !== null) {
                    status = rawData.status || "SELESAI";
                    
                    if (rawData.nilaiAkhir !== undefined) {
                        nilaiTampil = rawData.nilaiAkhir;
                        warnaNilai = "#2e7d32"; 
                    }

                    if (rawData.rekapJawaban) {
                        let rekapHtml = [];
                        for (const [tipe, rekapan] of Object.entries(rawData.rekapJawaban)) {
                            rekapHtml.push(`<div style="margin-bottom: 4px;"><span style="color:#1976d2; font-weight:600;">${tipe}:</span> ${rekapan}</div>`);
                        }
                        jawaban = rekapHtml.join('');
                    } else if (rawData.jawabanList) {
                        jawaban = rawData.jawabanList.join(', ');
                    }
                }

                // Tentukan Desain Badge Status
                let statusHtml = `<span class="badge-status status-active">Selesai Normal</span>`;
                if (status.toUpperCase().includes('DISKUALIFIKASI')) {
                    statusHtml = `<span class="badge-status" style="background: #ffebee; color: #d32f2f; border: 1px solid #ffcdd2; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 11px;">⚠️ ${status}</span>`;
                } else if (status !== "-" && status !== "") {
                    statusHtml = `<span class="badge-status status-pending">${status}</span>`;
                }

                // AMBIL NAMA SISWA DARI TABEL 'users' BERDASARKAN NISN
                let namaSiswaTampil = nisn;
                try {
                    const userSnap = await firebase.database().ref('users/' + nisn).once('value');
                    if (userSnap.exists()) {
                        const dataUser = userSnap.val();
                        if (dataUser && dataUser.nama) {
                            namaSiswaTampil = dataUser.nama;
                        }
                    }
                } catch (error) {
                    console.error("Gagal mengambil nama siswa untuk NISN " + nisn, error);
                }

                // --- Sembunyikan atau tampilkan tombol koreksi berdasarkan tipe soal ---
                let tombolKoreksiHtml = '';
                if (butuhKoreksiManual) {
                    tombolKoreksiHtml = `
                        <button class="btn-sm btn-info" style="padding: 6px; font-size: 12px; width: 100%; justify-content: center;" onclick="bukaKoreksi('${examId}', '${nisn}')">
                            ✍️ Koreksi
                        </button>
                    `;
                }

                // Susun Baris Tabel HTML
                const rowHtml = `
                    <tr>
                        <td style="text-align: center; font-weight: 500;">${no++}</td>
                        <td>
                            <div style="font-weight: 600; color: #1976d2;">${namaSiswaTampil}</div>
                            <div style="font-size: 11px; color: #888;">NISN: ${nisn}</div>
                        </td>
                        <td>${statusHtml}</td>
                        <td style="text-align: center; font-weight: bold; font-size: 15px; color: ${warnaNilai};">
                            ${nilaiTampil}
                        </td>
                        <td style="font-family: 'Courier New', monospace; font-size: 13px; background: #fdfdfd; word-break: break-all; letter-spacing: 0.5px;">
                            ${jawaban}
                        </td>
                        <td style="text-align: center;">
                            <div style="display: flex; flex-direction: column; gap: 5px;">
                                ${tombolKoreksiHtml}
                                <button class="btn-sm btn-danger" style="padding: 6px; font-size: 12px; width: 100%; justify-content: center;" onclick="resetUjianSiswa('${examId}', '${nisn}')">
                                    🔄 Reset
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
                tbody.insertAdjacentHTML('beforeend', rowHtml);
            }
        });
    }).catch((error) => {
        console.error("Gagal mengambil hasil ujian:", error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #d32f2f; padding: 20px;">❌ Gagal memuat data dari server.</td></tr>';
    });
}

// --- Fungsi Menghapus (Reset) Jawaban Siswa Tertentu ---
function resetUjianSiswa(examId, nisn) {
    const konfirmasi = confirm(`⚠️ PERINGATAN!\n\nApakah Anda yakin ingin mereset ujian untuk siswa dengan NISN: ${nisn}?\n\nSeluruh jawaban siswa ini akan dihapus permanen dari sistem dan ia harus mengulang ujian dari awal.`);
    
    if (konfirmasi) {
        // Hapus node NISN spesifik di dalam tabel jawaban_ujian -> examId
        firebase.database().ref(`jawaban_ujian/${examId}/${nisn}`).remove()
            .then(() => {
                alert(`✅ Ujian untuk NISN ${nisn} berhasil direset!`);
                // Muat ulang isi tabel agar nama siswa tersebut menghilang
                bukaModalHasil(examId); 
            })
            .catch((error) => {
                alert("❌ Gagal mereset ujian: " + error.message);
            });
    }
}

// Variabel global untuk menyimpan state saat guru sedang mengoreksi
let currentKoreksi = { examId: null, nisn: null, dataUjian: null, jawabanSiswa: null };

// Dipanggil dari tabel hasil ujian (ganti tombol 'Lihat' menjadi onclick="bukaKoreksi('id_ujian', 'nisn_siswa')")
function bukaKoreksi(examId, nisn) {
    // Tarik definisi soal
    firebase.database().ref('ujian/' + examId).once('value').then(ujianSnap => {
        const dataUjian = ujianSnap.val();
        // Tarik jawaban siswa
        firebase.database().ref(`jawaban_ujian/${examId}/${nisn}`).once('value').then(jawabSnap => {
            let jawabanSiswa = jawabSnap.val() || {};
            
            // --- FIX PENTING: Parse string JSON menjadi Object ---
            if (typeof jawabanSiswa === 'string') {
                try {
                    jawabanSiswa = JSON.parse(jawabanSiswa);
                } catch (e) {
                    console.error("Gagal mem-parse JSON jawaban:", e);
                    jawabanSiswa = {};
                }
            }
            // ---------------------------------------------------
            
            currentKoreksi = { examId, nisn, dataUjian, jawabanSiswa };
            renderFormKoreksi(dataUjian, jawabanSiswa);
            
            document.getElementById('koreksi-nama-siswa').innerText = `Koreksi Jawaban: ${jawabanSiswa.nama || nisn}`;
            openModal('koreksiModal');
        });
    });
}

function renderFormKoreksi(dataUjian, jawabanSiswa) {
    const container = document.getElementById('koreksi-container');
    let html = '';
    
    const getJawabanSiswa = (noSoal) => {
        if (jawabanSiswa.jawabanList && Array.isArray(jawabanSiswa.jawabanList)) {
            const index = parseInt(noSoal) - 1; 
            return jawabanSiswa.jawabanList[index];
        }
        return null;
    };
    
    let adaSoalManual = false;

    Object.keys(dataUjian.komposisiSoal).forEach(key => {
        const bagian = dataUjian.komposisiSoal[key];
        
        // HANYA RENDER JIKA TIPENYA BUKAN PG/PG KOMPLEKS/MENCOCOKKAN
        if (bagian.tipe !== 'PG' && bagian.tipe !== 'PG Kompleks' && bagian.tipe !== 'Mencocokkan') {
            adaSoalManual = true;
            const rentang = parseRentang(bagian.nomor);
            const poinMaxPerSoal = bagian.poinMax || 10; // Default 10 jika tidak ada
            
            html += `<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #ddd;">`;
            html += `<h4 style="margin-bottom: 10px; color: #4a90e2;">📝 Tipe: ${bagian.tipe} (Bobot: ${bagian.bobot}% | Poin Max per Soal: <strong style="color: #e74c3c;">${poinMaxPerSoal}</strong>)</h4>`;
            
            rentang.forEach((noSoal) => {
                const jawab = getJawabanSiswa(noSoal) || ''; 
                html += `<div style="margin-top: 10px; padding: 10px; border: 1px dashed #ccc; border-radius: 5px;">`;
                html += `<p><strong>No. ${noSoal}</strong> <span style="color: #888; font-size: 12px;"> (Poin Max: ${poinMaxPerSoal})</span></p>`;
                
                html += `<p style="background: #fff; padding: 8px; border-radius: 4px; font-style: italic;">Jawaban Siswa:<br/>${jawab || '<span style="color:#999">Tidak dijawab</span>'}</p>`;
                
                // Cek jika sudah ada nilai koreksi manual sebelumnya
                let poinLama = jawabanSiswa.koreksi_manual && jawabanSiswa.koreksi_manual[noSoal] ? jawabanSiswa.koreksi_manual[noSoal] : 0;
                
                html += `<div style="margin-top: 8px;">
                    <label>Poin Didapat: </label>
                    <input type="number" class="input-poin-manual" data-nosoal="${noSoal}" data-key="${key}" value="${poinLama}" style="width: 80px; padding: 4px;" min="0" max="${poinMaxPerSoal}">
                    <span style="color: #888; font-size: 12px;"> / ${poinMaxPerSoal}</span>
                </div>`;
                html += `</div>`;
            });
            
            // Tampilkan total poin maksimal untuk bagian ini
            const totalPoinMax = rentang.length * poinMaxPerSoal;
            html += `<div style="margin-top: 15px; background: #e9ecef; padding: 10px; border-radius: 5px;">
            </div>`;
            html += `</div>`;
        }
    });
    
    // Jika ternyata semua soal tipe otomatis, tampilkan pesan:
    if (!adaSoalManual) {
        html = `<div style="text-align: center; padding: 30px;">
            <h4 style="color: #28a745;">Seluruh ujian ini dikoreksi otomatis!</h4>
            <p style="color: #666; margin-top:10px;">Tekan tombol "Simpan Nilai Akhir" untuk langsung memproses nilai (PG / PG Kompleks / Mencocokkan).</p>
        </div>`;
    }
    
    container.innerHTML = html;
}

function simpanKoreksi() {
    const dataUjian = currentKoreksi.dataUjian;
    const jawabanSiswa = currentKoreksi.jawabanSiswa;
    let nilaiAkhir = 0;
    let koreksiManualSiswa = {};

    const getJawabanSiswa = (noSoal) => {
        if (jawabanSiswa.jawabanList && Array.isArray(jawabanSiswa.jawabanList)) {
            return jawabanSiswa.jawabanList[parseInt(noSoal) - 1];
        }
        return "";
    };

    // LOOPING SELURUH BAGIAN UNTUK MENGHITUNG NILAI TOTAL
    Object.keys(dataUjian.komposisiSoal).forEach(key => {
        const bagian = dataUjian.komposisiSoal[key];
        const bobot = parseFloat(bagian.bobot) || 0;
        const rentang = parseRentang(bagian.nomor);
        
        // --- 1. HITUNG OTOMATIS: PG & PG Kompleks (Di Latar Belakang) ---
        if (bagian.tipe === 'PG' || bagian.tipe === 'PG Kompleks') {
            const kunciArr = bagian.kunci.split(',');
            let skorBagian = 0;
            
            rentang.forEach((noSoal, index) => {
                const jawab = getJawabanSiswa(noSoal);
                const kunciBenar = kunciArr[index] || '-';
                if (jawab && kunciBenar !== '-' && jawab.replace(/\s/g,'').toUpperCase() === kunciBenar.toUpperCase()) {
                    skorBagian += 1;
                }
            });
            if (rentang.length > 0) {
                nilaiAkhir += (skorBagian / rentang.length) * bobot;
            }
        } 
        // --- 2. HITUNG OTOMATIS: Mencocokkan (Di Latar Belakang) ---
        else if (bagian.tipe === 'Mencocokkan') {
            const kunciPerSoal = bagian.kunci.split(';');
            let skorTotalBagian = 0;
            let poinMaxTotalBagian = 0;
            
            rentang.forEach((noSoal, index) => {
                const jawab = getJawabanSiswa(noSoal) || "";
                const kunciKasar = kunciPerSoal[index] ? kunciPerSoal[index].trim() : "";
                const kunciPairs = kunciKasar.split(',').filter(k => k.trim() !== "");
                const jawabPairs = jawab.split(',').map(j => j.replace(/\s/g,'').toUpperCase()); 
                
                let poinSoalIni = 0;
                let poinMaxSoalIni = kunciPairs.length > 0 ? kunciPairs.length : 1; 
                
                if (kunciPairs.length > 0) {
                    kunciPairs.forEach(pasanganBenar => {
                        if (jawabPairs.includes(pasanganBenar.toUpperCase())) poinSoalIni++;
                    });
                }
                skorTotalBagian += poinSoalIni;
                poinMaxTotalBagian += poinMaxSoalIni;
            });
            
            if (poinMaxTotalBagian > 0) {
                nilaiAkhir += (skorTotalBagian / poinMaxTotalBagian) * bobot;
            }
        }
        // --- 3. AMBIL DATA MANUAL DARI FORM: Isian Singkat & Essay ---
        else {
            const inputPoinManualList = document.querySelectorAll(`.input-poin-manual[data-key="${key}"]`);
            
            // --- PERBAIKAN: Ambil maxSkor langsung dari Data Firebase ---
            // 1. Ambil poin maksimal per soal dari database (default 10 jika kosong)
            const poinMaxPerSoal = parseFloat(bagian.poinMax) || 10; 
            // 2. Hitung jumlah soal pada bagian ini
            const jumlahSoal = rentang.length > 0 ? rentang.length : 1; 
            // 3. Kalikan untuk mendapatkan Total Max Skor pada bagian ini
            const maxSkor = poinMaxPerSoal * jumlahSoal; 
            // -------------------------------------------------------------
            
            let totalSkorManual = 0;
            inputPoinManualList.forEach(input => {
                const poin = parseFloat(input.value) || 0;
                const noSoal = input.dataset.nosoal;
                totalSkorManual += poin;
                koreksiManualSiswa[noSoal] = poin;
            });
            
            nilaiAkhir += (totalSkorManual / maxSkor) * bobot;
        }
        
    });

    // Bulatkan nilai ke 2 angka desimal
    nilaiAkhir = Math.round(nilaiAkhir * 100) / 100;

    // Persiapkan data format JSON
    const payloadPenyimpanan = {
        ...jawabanSiswa, 
        nilaiAkhir: nilaiAkhir,
        koreksi_manual: koreksiManualSiswa,
        status: "SELESAI" // Ubah status siswa agar dianggap sudah beres
    };

    // Push/Set ke Database Firebase
    firebase.database().ref(`jawaban_ujian/${currentKoreksi.examId}/${currentKoreksi.nisn}`)
        .set(payloadPenyimpanan)
        .then(() => {
            alert(`Koreksi Berhasil Disimpan!\nNilai Akhir Siswa: ${nilaiAkhir}`);
            closeModal('koreksiModal');
            
            // --- Coba Refresh Data Tabel ---
            if (typeof bukaModalHasil === "function") {
                 bukaModalHasil(currentKoreksi.examId, dataUjian.token);
            } else {
                 location.reload(); // Fallback reload halaman
            }
        })
        .catch((error) => {
            alert("Gagal menyimpan koreksi: " + error.message);
        });
}

// Fungsi Bantuan untuk memecah rentang nomor "1-5" menjadi [1,2,3,4,5]
function parseRentang(str) {
    if (str.includes('-')) {
        let parts = str.split('-');
        let arr = [];
        for (let i = parseInt(parts[0]); i <= parseInt(parts[1]); i++) {
            arr.push(i.toString());
        }
        return arr;
    }
    return [str.trim()];
}

// --- Fungsi Export Hasil Ujian ke Excel ---
function downloadExcelHasil(examId, namaMapel, kelas) {
    // 1. Ambil data komposisi ujian terlebih dahulu
    firebase.database().ref('ujian/' + examId).once('value').then((examSnapshot) => {
        if (!examSnapshot.exists()) {
            alert("Data ujian tidak ditemukan!");
            return;
        }
        
        const dataUjian = examSnapshot.val();
        const komposisi = dataUjian.komposisiSoal || {};
        
        // 2. Ambil data jawaban siswa
        firebase.database().ref('jawaban_ujian/' + examId).once('value').then((jawabanSnapshot) => {
            if (!jawabanSnapshot.exists()) {
                alert("Belum ada data siswa yang mengerjakan ujian ini.");
                return;
            }

            const dataJawaban = jawabanSnapshot.val();
            let dataExcel = [];
            let promises = []; 

            // 3. Iterasi tiap siswa
            Object.keys(dataJawaban).forEach(nisnSiswa => {
                const rawData = dataJawaban[nisnSiswa];
                let siswa = {};

                // Parsing text ke JSON jika perlu
                if (typeof rawData === 'string') {
                    try {
                        siswa = JSON.parse(rawData);
                    } catch (e) {
                        console.error("Gagal membaca jawaban dari NISN: " + nisnSiswa);
                    }
                } else if (typeof rawData === 'object' && rawData !== null) {
                    siswa = rawData;
                }

                // Ambil Nama Siswa dari tabel users
                const userPromise = firebase.database().ref('users/' + nisnSiswa).once('value').then((userSnap) => {
                    let namaSiswa = "-";
                    if (userSnap.exists()) {
                        namaSiswa = userSnap.val().nama || "-";
                    }

                    // Susun field-field utama
                    let rowData = {
                        "No": 0, 
                        "NISN": nisnSiswa,
                        "Nama Siswa": namaSiswa,
                        "Status": siswa.status || "Selesai",
                        "Nilai Ujian": siswa.nilaiAkhir !== undefined ? siswa.nilaiAkhir : "Belum Dikoreksi"
                    };

                    // --- PERBAIKAN: Ambil Jawaban berdasarkan 'rekapJawaban' ---
                    if (Object.keys(komposisi).length > 0) {
                        Object.keys(komposisi).forEach(keyBagian => {
                            const tipe = komposisi[keyBagian].tipe;
                            let jawabanBagian = "-";
                            
                            // Cek jawaban siswa di dalam rekapJawaban berdasarkan tipe
                            if (siswa.rekapJawaban && siswa.rekapJawaban[tipe] !== undefined) {
                                jawabanBagian = siswa.rekapJawaban[tipe];
                            } 
                            // Fallback jika jawaban disimpan per bagian_x
                            else if (siswa[keyBagian] !== undefined) {
                                jawabanBagian = siswa[keyBagian];
                            }

                            // Pastikan jika bentuknya objek (bukan teks) kita jadikan string
                            if (typeof jawabanBagian === 'object' && jawabanBagian !== null) {
                                jawabanBagian = JSON.stringify(jawabanBagian);
                            } else if (!jawabanBagian || jawabanBagian === "") {
                                jawabanBagian = "-";
                            }
                            
                            rowData[`Jawaban (${tipe})`] = jawabanBagian;
                        });
                    } else if (siswa.jawabanList) {
                        // Jika struktur ujian tidak ada tapi ada jawabanList (Array)
                         rowData[`Semua Jawaban`] = Array.isArray(siswa.jawabanList) ? siswa.jawabanList.join(', ') : siswa.jawabanList;
                    }

                    dataExcel.push(rowData);
                });

                // Antre proses pencarian user
                promises.push(userPromise);
            });

            // 4. Tunggu semua data nama terisi sebelum mengekspor Excel
            Promise.all(promises).then(() => {
                // Urutkan berdasarkan NISN agar tidak acak
                dataExcel.sort((a, b) => a.NISN.localeCompare(b.NISN));

                // Rapihkan nomor urut
                let no = 1;
                dataExcel.forEach(row => {
                    row["No"] = no++;
                });

                // 5. PROSES EXPORT MENGGUNAKAN SHEETJS
                const worksheet = XLSX.utils.json_to_sheet(dataExcel);
                
                const wscols = [
                    {wch: 5},   // No
                    {wch: 15},  // NISN
                    {wch: 35},  // Nama
                    {wch: 12},  // Status
                    {wch: 15}   // Nilai
                ];
                worksheet['!cols'] = wscols;

                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Hasil Ujian");
                
                const namaFile = `Rekap_Nilai_${namaMapel.replace(/\s+/g, '_')}_Kelas_${kelas}.xlsx`;
                XLSX.writeFile(workbook, namaFile);
            });

        }).catch((error) => {
            console.error("Error:", error);
            alert("Terjadi kesalahan saat mengambil data jawaban: " + error.message);
        });
    }).catch((error) => {
         console.error("Error:", error);
         alert("Terjadi kesalahan saat mengambil data referensi ujian: " + error.message);
    });
}