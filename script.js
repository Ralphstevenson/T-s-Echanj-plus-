// 1. Konfigirasyon Firebase ki Egzak pou pwojè Echanj plus ou an
const firebaseConfig = {
  apiKey: "AIzaSyB1VOHe4jsJ6_9KMyoGkF3fNgxRVM4M45Q",
  authDomain: "echanj-plus-fa9b0.firebaseapp.com",
  databaseURL: "https://echanj-plus-fa9b0-default-rtdb.firebaseio.com",
  projectId: "echanj-plus-fa9b0",
  storageBucket: "echanj-plus-fa9b0.firebasestorage.app",
  messagingSenderId: "888002521405",
  appId: "1:888002521405:web:8d819501cadea9c57b7d54"
};

// Inisyalize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let confirmationResultRegister = null;
let confirmationResultLogin = null;

document.addEventListener("DOMContentLoaded", () => {
    
    // Inisyalize reCAPTCHA
    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        'size': 'invisible'
    });

    window.recaptchaVerifierLogin = new firebase.auth.RecaptchaVerifier('recaptcha-container-login', {
        'size': 'invisible'
    });

    verifieAksesPaj();

    // Event Listeners
    document.getElementById('btn-voye-otp').addEventListener('click', voyeOTPRegister);
    document.getElementById('btn-valide-otp').addEventListener('click', valideOTPRegister);
    
    document.getElementById('btn-voye-otp-login').addEventListener('click', voyeOTPLogin);
    document.getElementById('btn-valide-otp-login').addEventListener('click', valideOTPLogin);
    
    document.getElementById('btn-dekonekte').addEventListener('click', dekonekteUser);

    // Navigasyon
    document.getElementById('link-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        ameneSouScreen('login');
    });

    document.getElementById('link-to-login-2').addEventListener('click', (e) => {
        e.preventDefault();
        ameneSouScreen('login');
    });

    document.getElementById('link-to-register').addEventListener('click', (e) => {
        e.preventDefault();
        ameneSouScreen('register');
    });
});

function verifieAksesPaj() {
    const isConnected = localStorage.getItem('user_connected');
    const savedPhone = localStorage.getItem('user_phone');

    if (isConnected === 'true' && savedPhone) {
        document.getElementById('interface-auth').classList.add('hidden');
        document.getElementById('interface-dashboard').classList.remove('hidden');
        document.getElementById('user-phone-display').innerText = savedPhone;
        kouteSMSNanFirebase();
    } else {
        document.getElementById('interface-dashboard').classList.add('hidden');
        document.getElementById('interface-auth').classList.remove('hidden');
        ameneSouScreen('register');
    }
}

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

function voyeOTPRegister() {
    const rawInput = document.getElementById('phoneNumber').value;
    const statusMsg = document.getElementById('status-msg');

    let cleanPhone = rawInput.replace(/\s+/g, '').replace(/-/g, '');

    if (!cleanPhone) {
        statusMsg.style.color = "#dc3545";
        statusMsg.innerText = "Tanpri antre yon nimewo telefòn!";
        return;
    }

    if (!cleanPhone.startsWith('+')) {
        if (cleanPhone.startsWith('509')) {
            cleanPhone = '+' + cleanPhone;
        } else {
            cleanPhone = '+509' + cleanPhone;
        }
    }

    statusMsg.style.color = "#0d6efd";
    statusMsg.innerText = "N ap voye SMS la...";

    auth.signInWithPhoneNumber(cleanPhone, window.recaptchaVerifier)
        .then((confirmationResult) => {
            confirmationResultRegister = confirmationResult;
            statusMsg.innerText = "";
            ameneSouScreen('otp');
        })
        .catch((error) => {
            console.error(error);
            statusMsg.style.color = "#dc3545";
            statusMsg.innerText = "Erè: " + error.message;
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

function voyeOTPLogin() {
    const rawInput = document.getElementById('loginPhone').value;
    const statusMsg = document.getElementById('status-msg');

    let cleanPhone = rawInput.replace(/\s+/g, '').replace(/-/g, '');

    if (!cleanPhone) {
        statusMsg.innerText = "Tanpri antre nimewo kont ou an!";
        return;
    }

    if (!cleanPhone.startsWith('+')) {
        if (cleanPhone.startsWith('509')) {
            cleanPhone = '+' + cleanPhone;
        } else {
            cleanPhone = '+509' + cleanPhone;
        }
    }

    statusMsg.style.color = "#0d6efd";
    statusMsg.innerText = "N ap voye SMS koneksyon an...";

    auth.signInWithPhoneNumber(cleanPhone, window.recaptchaVerifierLogin)
        .then((confirmationResult) => {
            confirmationResultLogin = confirmationResult;
            statusMsg.innerText = "";
            document.getElementById('login-otp-box').classList.remove('hidden');
        })
        .catch((error) => {
            console.error(error);
            statusMsg.style.color = "#dc3545";
            statusMsg.innerText = "Erè: " + error.message;
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

function soveEpiKonekte(phone) {
    localStorage.setItem('user_connected', 'true');
    localStorage.setItem('user_phone', phone);
    verifieAksesPaj();
}

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

function dekonekteUser() {
    localStorage.clear();
    auth.signOut().then(() => {
        verifieAksesPaj();
    });
          }
               
