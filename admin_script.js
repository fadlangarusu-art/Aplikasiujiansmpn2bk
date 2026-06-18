// Konfigurasi Firebase
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

// Inisialisasi Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// 1. Fungsi Pindah Menu
function switchMenu(menuName) {
    document.getElementById('view-dashboard').style.display = 'none';
    document.getElementById('view-pengguna').style.display = 'none';
    
    document.getElementById('link-dashboard').classList.remove('active');
    document.getElementById('link-pengguna').classList.remove('active');

    if (menuName === 'dashboard') {
        document.getElementById('view-dashboard').style.display = 'block';
        document.getElementById('link-dashboard').classList.add('active');
    } else if (menuName === 'pengguna') {
        document.getElementById('view-pengguna').style.display = 'block';
        document.getElementById('link-pengguna').classList.add('active');
    }
}

// 2. Fungsi Khusus Menampilkan Modal "Lihat Akun" Guru
function showAccountModal(name, username, password) {
    document.getElementById('modalName').innerText = name;
    document.getElementById('modalUsername').value = username;
    document.getElementById('modalPassword').value = password;
    openModal('accountModal');
}

// 3. Fungsi Universal Buka/Tutup Modal Berdasarkan ID
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

// Fungsi Menutup Modal Universal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// 4. Fungsi Khusus Menutup Modal Akun (Tambahan Pengaman)
function closeAccountModal() {
    const modal = document.getElementById('accountModal') || document.getElementById('account-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 5. Fungsi Proses Logout
function prosesLogout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'index.html';
}

// GANTI fungsi setujuiAkun lama dengan ini:
function setujuiAkun(uid, namaPengguna) {
    Swal.fire({
        title: 'Apakah Anda yakin?',
        text: `Ingin MENGAKTIFKAN akun milik ${namaPengguna}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#dc3545',
        confirmButtonText: 'Ya, Aktifkan!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: 'Memproses...',
                text: 'Sedang mengaktifkan akun.',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            firebase.database().ref('users/' + uid).update({ status: 'approved' })
            .then(() => {
                Swal.fire('Berhasil!', `Akun ${namaPengguna} sekarang bisa login.`, 'success');
            })
            .catch((error) => {
                Swal.fire('Terjadi Kesalahan', error.message, 'error');
            });
        }
    });
}

// GANTI fungsi tolakAkun lama dengan ini:
function tolakAkun(uid, namaPengguna) {
    Swal.fire({
        title: 'Apakah Anda yakin?',
        text: `Ingin MENOLAK dan MENGHAPUS pendaftaran ${namaPengguna}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Tolak!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: 'Memproses...',
                text: 'Sedang menolak dan menghapus pendaftaran.',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            firebase.database().ref('users/' + uid).remove()
            .then(() => {
                Swal.fire('Ditolak!', `Pendaftaran ${namaPengguna} telah ditolak dan dihapus.`, 'success');
            })
            .catch((error) => {
                Swal.fire('Terjadi Kesalahan', error.message, 'error');
            });
        }
    });
}

// 7. Memuat Data Realtime Firebase
const tabelPending = document.getElementById('tabel-pending');
function loadDataPending() {
    firebase.database().ref('users').orderByChild('status').equalTo('pending').on('value', (snapshot) => {
        tabelPending.innerHTML = '';
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const uid = childSnapshot.key;
                const data = childSnapshot.val();
                const row = `
                    <tr id="${uid}">
                        <td>${data.nama}</td>
                        <td><span style="background: #e3f2fd; color: #1976d2; padding: 3px 8px; border-radius: 4px; font-size: 12px; text-transform: capitalize;">${data.role}</span></td>
                        <td>
                            <button class="btn-sm btn-success" onclick="setujuiAkun('${uid}', '${data.nama}')">✅ Setujui</button>
                            <button class="btn-sm btn-danger" onclick="tolakAkun('${uid}', '${data.nama}')">❌ Tolak</button>
                        </td>
                    </tr>
                `;
                tabelPending.innerHTML += row;
            });
        } else {
            tabelPending.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">Tidak ada akun yang menunggu persetujuan.</td></tr>';
        }
    });
}

function loadDataSiswa() {
    const tableBodySiswa = document.getElementById('table-siswa-body');
    if (!tableBodySiswa) return; 

    firebase.database().ref('users').on('value', (snapshot) => {
        tableBodySiswa.innerHTML = '';
        let no = 1;
        let adaData = false;

        snapshot.forEach((childSnapshot) => {
            const childData = childSnapshot.val();
            const nisn = childSnapshot.key; 

            if (childData.role === 'siswa') {
                adaData = true;
                
                const password = childData.password ? childData.password : '123456';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${no++}</td>
                    <td><strong>${childData.nama || '-'}</strong></td>
                    <td>${nisn}</td> 
                    <td>${childData.kelas || '-'}</td>
                    <td style="display: flex; gap: 5px; align-items: center; white-space: nowrap;">
                        <button class="btn-sm btn-info" onclick="showAccountModal('${childData.nama || '-'}', '${nisn}', '${password}')">👁️ Akun</button>
                        <button class="btn-sm btn-danger" onclick="hapusPengguna('${nisn}', '${childData.nama}')">🗑️ Hapus</button>
                    </td>
                `;
                tableBodySiswa.appendChild(tr);
            }
        });

        if (!adaData) {
            tableBodySiswa.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #888;">Belum ada data siswa terdaftar.</td></tr>`;
        } else {
            filterSiswa(); 
        }
    });
}

const tabelGuru = document.getElementById('tabel-guru');
function loadDataGuru() {
    firebase.database().ref('users').orderByChild('role').equalTo('guru').on('value', (snapshot) => {
        tabelGuru.innerHTML = '';
        let no = 1;
        let adaGuru = false;

        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const uid = childSnapshot.key;
                const data = childSnapshot.val();

                if (data.status === 'approved') {
                    adaGuru = true;
                    const nip = data.nip ? data.nip : '-'; 
                    const password = data.password ? data.password : 'Disembunyikan';

                    const row = `
                        <tr id="guru-${uid}">
                            <td>${no++}</td>
                            <td>${data.nama}</td>
                            <td>${nip}</td>
                            <td>
                                <button class="btn-sm btn-info" onclick="showAccountModal('${data.nama}', '${uid}', '${password}')">👁️ Akun</button>
                                <button class="btn-sm btn-danger" onclick="hapusPengguna('${uid}', '${data.nama}')">❌ Hapus</button>
                            </td>
                        </tr>
                    `;
                    tabelGuru.innerHTML += row;
                }
            });

            if (!adaGuru) {
                tabelGuru.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Belum ada data guru yang disetujui.</td></tr>';
            }
        } else {
            tabelGuru.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Tidak ada data guru.</td></tr>';
        }
    });
}

function filterSiswa() {
    const input = document.getElementById('search-siswa');
    if (!input) return;

    const filter = input.value.toLowerCase();
    const tableBodySiswa = document.getElementById('table-siswa-body');
    const rows = tableBodySiswa.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        if (rows[i].cells.length < 5) continue;

        const namaCell = rows[i].cells[1];
        const nisnCell = rows[i].cells[2];

        if (namaCell && nisnCell) {
            const namaText = namaCell.textContent || namaCell.innerText;
            const nisnText = nisnCell.textContent || nisnCell.innerText;

            if (namaText.toLowerCase().indexOf(filter) > -1 || nisnText.toLowerCase().indexOf(filter) > -1) {
                rows[i].style.display = "";
            } else {
                rows[i].style.display = "none";
            }
        }
    }
}

// GANTI fungsi hapusPengguna lama dengan kode ini:
function hapusPengguna(uid, nama) {
    Swal.fire({
        title: 'Apakah Anda yakin?',
        text: `Ingin MENGHAPUS akun ${nama} secara permanen? Data yang dihapus tidak bisa dikembalikan.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545', // Warna merah untuk tombol hapus
        cancelButtonColor: '#6c757d',  // Warna abu-abu untuk batal
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            // Menampilkan efek Loading
            Swal.fire({
                title: 'Menghapus...',
                text: 'Sedang menghapus data akun dari Database dan Authentication.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // KODE BARU: Memanggil server Localhost (Node.js) untuk menghapus
            fetch('http://localhost:3000/api/hapus-pengguna', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: uid })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Server gagal memproses permintaan.');
                }
                return response.json();
            })
            .then(data => {
                // Notifikasi Sukses
                Swal.fire({
                    title: 'Berhasil Dihapus!',
                    text: `Akun ${nama} berhasil dihapus secara permanen dari Database dan Authentication.`,
                    icon: 'success',
                    confirmButtonColor: '#28a745'
                });
                
                // Opsional: Jika Anda punya fungsi untuk me-refresh tabel secara otomatis,
                // panggil fungsinya di sini, misalnya: loadDataPengguna() atau tutup modal.
            })
            .catch((error) => {
                // Notifikasi Gagal (Sering kali karena server Node.js belum dinyalakan)
                Swal.fire({
                    title: 'Terjadi Kesalahan',
                    text: "Gagal menghapus! Pastikan server lokal (Node.js) sudah Anda nyalakan di Terminal. Detail: " + error.message,
                    icon: 'error',
                    confirmButtonColor: '#dc3545'
                });
            });
        }
    });
}

// 8. Fungsi Memuat Data Kelas dari Database secara Dinamis
function loadDataKelas() {
    const selectKelas = document.getElementById('select-kelas');
    if (!selectKelas) return;

    firebase.database().ref('users').on('value', (snapshot) => {
        selectKelas.innerHTML = '<option value="" disabled selected>Pilih Kelas</option>';

        if (snapshot.exists()) {
            const setKelas = new Set(); 

            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                if (data.role === 'siswa' && data.kelas) {
                    setKelas.add(data.kelas);
                }
            });

            const listKelas = Array.from(setKelas).sort();

            listKelas.forEach((namaKelas) => {
                const option = document.createElement('option');
                option.value = namaKelas;
                option.innerText = namaKelas;
                selectKelas.appendChild(option);
            });

            if (listKelas.length === 0) {
                selectKelas.innerHTML = '<option value="" disabled selected>Belum ada data siswa terdaftar</option>';
            }
        }
    });
}

// 9. Fungsi Menyimpan Data Siswa Baru ke Firebase (Diperbarui dengan SweetAlert2)
function simpanDataSiswa(event) {
    event.preventDefault(); 

    const nama = document.getElementById('input-nama-siswa').value;
    const nisn = document.getElementById('input-nisn').value;
    const kelas = document.getElementById('select-kelas').value;
    const agama = document.getElementById('input-agama').value;

    // Peringatan jika form ada yang kosong
    if (!nama || !nisn || !kelas || !agama) {
        Swal.fire({
            icon: 'warning',
            title: 'Data Belum Lengkap',
            text: 'Harap lengkapi semua isian pada form!'
        });
        return;
    }

    // Menampilkan efek Loading saat proses simpan
    Swal.fire({
        title: 'Menyimpan Data...',
        text: 'Sedang mendaftarkan siswa baru.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // Proses simpan ke Firebase Database
    firebase.database().ref('users/' + nisn).set({
        nama: nama,
        kelas: kelas,
        agama: agama,
        role: 'siswa',
        status: 'approved',
        password: '123456' 
    })
    .then(() => {
        // Notifikasi Sukses
        Swal.fire({
            icon: 'success',
            title: 'Berhasil Ditambahkan!',
            text: `Data siswa ${nama} berhasil ditambahkan dengan password default: 123456`,
            confirmButtonColor: '#28a745'
        }).then(() => {
            // Tutup modal dan reset form HANYA setelah tombol OK diklik
            closeModal('addStudentModal'); 
            document.getElementById('formTambahSiswa').reset(); 
        });
    })
    .catch((error) => {
        // Notifikasi Error jika gagal
        Swal.fire({
            icon: 'error',
            title: 'Gagal Menyimpan',
            text: "Terjadi kesalahan: " + error.message,
            confirmButtonColor: '#dc3545'
        });
    });
}

// 10. FUNGSI BARU: Memuat Statistik Dashboard Utama secara Realtime
function loadDashboardStats() {
    const totalGuruElem = document.getElementById('stat-total-guru');
    const totalSiswaElem = document.getElementById('stat-total-siswa');
    const totalKelasElem = document.getElementById('stat-total-kelas');
    
    if (!totalGuruElem || !totalSiswaElem || !totalKelasElem) return;

    firebase.database().ref('users').on('value', (snapshot) => {
        let totalGuru = 0;
        let totalSiswa = 0;
        const setKelas = new Set(); // Menggunakan Set agar nama kelas terhitung unik (tidak duplikat)

        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                
                // Menghitung Guru yang statusnya sudah disetujui (approved)
                if (data.role === 'guru' && data.status === 'approved') {
                    totalGuru++;
                } 
                // Menghitung Siswa & mengumpulkan data kelas unik
                else if (data.role === 'siswa') {
                    totalSiswa++;
                    if (data.kelas) {
                        setKelas.add(data.kelas);
                    }
                }
            });
        }

        // Tampilkan angka hasil perhitungan ke elemen HTML dashboard
        totalGuruElem.innerText = totalGuru;
        totalSiswaElem.innerText = totalSiswa;
        totalKelasElem.innerText = setKelas.size;
    });
}

// Inisialisasi awal saat halaman terbuka
window.onload = function() {
    loadDashboardStats(); // Jalankan fungsi statistik di sini
    loadDataPending();
    loadDataGuru();
    loadDataSiswa();
    loadDataKelas(); 
};