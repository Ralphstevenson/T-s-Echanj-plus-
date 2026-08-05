// 1. Konfigirasyon Firebase ou an
const firebaseConfig = {
  apiKey: "AIzaSyB1VOHe4jsJ6_9KMyoGkF3fNgxRVM4M45Q",
  authDomain: "echanjplus-app.firebaseapp.com",
  databaseURL: "https://echanjplus-app-default-rtdb.firebaseio.com",
  projectId: "echanjplus-app",
  storageBucket: "echanjplus-app.firebasestorage.app",
  messagingSenderId: "888002521405",
  appId: "1:888002521405:web:8d819501cadea9c57b7d54"
};

// Inisyalize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// Variyab pou kenbe konfimasyon reCAPTCHA yo
let confirmationResultRegister = null;
let confirmationResultLogin = null;

// Lè tout paj la fin chaje nan navigatè a
document.addEventListener("DOMContentLoaded", () => {
    
    // Inisyalize reCAPTCHA enfizib yo pou Firebase Auth
    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        'size': 'invisible'
    });

    window.recaptchaVerifierLogin = new firebase.auth.RecaptchaVerifier('recaptcha-container-login', {
        'size': 'invisible'
    });

    // TCHEKE SOU KI PAJ POUM METE ITILIZATÈ A (Moun ki pa konekte PAKA wè Home)
    verifieAksesPaj();

    // ================= EVENT LISTENERS POU BOUTON YO =================
    
    // Enskripsyon
    document.getElementById('btn-voye-otp').addEventListener('click', voyeOTPRegister);
    document.getElementById('btn-valide-otp').addEventListener('click', valideOTPRegister);
    
    // Koneksyon (Login)
    document.getElementById('btn-voye-otp-login').addEventListener('click', voyeOTPLogin);
    document.getElementById('btn-valide-otp-login').addEventListener('click', valideOTPLogin);
    
    // Dekonekte
    document.getElementById('btn-dekonekte').addEventListener('click', dekonekteUser);

    // ================= NAVIGATION AK LYEN YO =================
    
    // Soti nan Screen 1 oswa 2 ale nan Login
    document.getElementById('link-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        ameneSouScreen('login');
    });

    document.getElementById('link-to-login-2').addEventListener('click', (e) => {
        e.preventDefault();
        ameneSouScreen('login');
    });

    // Soti nan Login ale nan Enskripsyon
    document.getElementById('link-to-register').addEventListener('click', (e) => {
        e.preventDefault();
        ameneSouScreen('register');
    });
});

// Fonksyon ki kontwole ki ekran ki dwe parèt
function verifieAksesPaj() {
    const isConnected = localStorage.getItem('user_connected');
    const savedPhone = localStorage.getItem('user_phone');

    if (isConnected === 'true' && savedPhone) {
        // ITILIZATÈ A KONEKTE: Montre Paj Home (Dashboard), Kache tout Auth
        document.getElementById('interface-auth').classList.add('hidden');
        document.getElementById('interface-dashboard').classList.remove('hidden');
        document.getElementById('user-phone-display').innerText = savedPhone;
        
        // Kòmanse koute SMS nan Firebase
        kouteSMSNanFirebase();
    } else {
        // ITILIZATÈ A PA KONEKTE: Bloke Home, Montre Screen 1 Enskripsyon
        document.getElementById('interface-dashboard').classList.add('hidden');
        document.getElementById('interface-auth').classList.remove('hidden');
        ameneSouScreen('register');
    }
}

// Fonksyon pou pase sot nan yon ekran ale nan yon lòt nan Auth
function ameneSouScreen(screenName) {
    document.getElementById('step-phone').classList.add('hidden');
    document.getElementById('step-otp').classList.add('hidden');
    document.getElementById('step-login').classList.add('hidden');
    document.getElementById('status-msg').innerText = "";

    if (screenName === 'register') {
        document.getElementById('step-phone').classList.remove('hidden');
        document.getElementById('auth-title').innerText = "Enskripsyon";
    } else if (screenName === 'otp') {
        document.getElementById('step-otp').classList.remove('hidden');
        document.getElementById('auth-title').innerText = "Valide OTP Enskripsyon";
    } else if (screenName === 'login') {
        document.getElementById('step-login').classList.remove('hidden');
        document.getElementById('auth-title').innerText = "Koneksyon (Login)";
    }
}

// ================= LOJIK ENSKRIPSYON (REGISTER) =================

function voyeOTPRegister() {
    const rawPhone = document.getElementById('phoneNumber').value.trim();
    const statusMsg = document.getElementById('status-msg');

    if (!rawPhone) {
        statusMsg.innerText = "Tanpri antre yon nimewo telefòn!";
        return;
    }

    let formattedPhone = rawPhone.startsWith('+') ? rawPhone : '+509' + rawPhone;
    statusMsg.innerText = "N ap voye SMS la...";

    auth.signInWithPhoneNumber(formattedPhone, window.recaptchaVerifier)
        .then((confirmationResult) => {
            confirmationResultRegister = confirmationResult;
            statusMsg.innerText = "";
            ameneSouScreen('otp'); // Bascule sou Screen 2 Auth
        })
        .catch((error) => {
            console.error(error);
            statusMsg.innerText = "Erè nan voye SMS la. Tcheke nimewo a!";
        });
}

function valideOTPRegister() {
    const code = document.getElementById('otpCode').value.trim();
    const statusMsg = document.getElementById('status-msg');

    if (code.length < 6) {
        statusMsg.innerText = "Antre tout 6 chif kòd OTP a!";
        return;
    }

    confirmationResultRegister.confirm(code)
        .then((result) => {
            const user = result.user;
            soveEpiKonekte(user.phoneNumber);
        })
        .catch((error) => {
            console.error(error);
            statusMsg.innerText = "Kòd OTP sa a pa bon!";
        });
}

// ================= LOJIK KONEKSYON (LOGIN) =================

function voyeOTPLogin() {
    const rawPhone = document.getElementById('loginPhone').value.trim();
    const statusMsg = document.getElementById('status-msg');

    if (!rawPhone) {
        statusMsg.innerText = "Tanpri antre nimewo kont ou an!";
        return;
    }

    let formattedPhone = rawPhone.startsWith('+') ? rawPhone : '+509' + rawPhone;
    statusMsg.innerText = "N ap voye SMS koneksyon an...";

    auth.signInWithPhoneNumber(formattedPhone, window.recaptchaVerifierLogin)
        .then((confirmationResult) => {
            confirmationResultLogin = confirmationResult;
            statusMsg.innerText = "";
            // Montre bwat pou rantre OTP koneksyon an
            document.getElementById('login-otp-box').classList.remove('hidden');
        })
        .catch((error) => {
            console.error(error);
            statusMsg.innerText = "Erè nan voye SMS la. Tcheke nimewo a!";
        });
}

function valideOTPLogin() {
    const code = document.getElementById('loginOtpCode').value.trim();
    const statusMsg = document.getElementById('status-msg');

    if (code.length < 6) {
        statusMsg.innerText = "Antre tout 6 chif kòd OTP la!";
        return;
    }

    confirmationResultLogin.confirm(code)
        .then((result) => {
            const user = result.user;
            soveEpiKonekte(user.phoneNumber);
        })
        .catch((error) => {
            console.error(error);
            statusMsg.innerText = "Kòd OTP sa a pa bon!";
        });
}

// Fonksyon pou sove sesyon an epi ouvri Paj Home
function soveEpiKonekte(phone) {
    localStorage.setItem('user_connected', 'true');
    localStorage.setItem('user_phone', phone);
    verifieAksesPaj();
}

// ================= PAJ HOME: RALE SMS YO NAN FIREBASE =================

function kouteSMSNanFirebase() {
    const smsContainer = document.getElementById('sms-container');

    db.ref('SMSARS').on('value', (snapshot) => {
        smsContainer.innerHTML = "";
        const data = snapshot.val();

        if (!data) {
            smsContainer.innerHTML = "<p>Pa gen okenn SMS anrejistre pou kounye a.</p>";
            return;
        }

        let jwennSMS = false;

        Object.keys(data).forEach(key => {
            const smsData = data[key];
            if (Array.isArray(smsData)) {
                jwannSMS = true;
                const div = document.createElement('div');
                div.innerHTML = `<p><b>Soti nan:</b> ${smsData[0]}</p><p><b>Mesaj:</b> ${smsData[1]}</p>`;
                smsContainer.appendChild(div);
            }
        });

        if (!jwannSMS) {
            smsContainer.innerHTML = "<p>Pa gen nouvo SMS ki monte nan sistèm nan.</p>";
        }
    });
}

// Dekonekte epi re-mande koneksyon
function dekonekteUser() {
    localStorage.clear();
    auth.signOut().then(() => {
        verifieAksesPaj();
    });
}