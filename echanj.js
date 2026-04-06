/**
 * Gid: Jere kalkil echanj ak rabè 16.5%
 */

export function initEchanjLogic(userData) {
    window.openDialer = function(provider) {
        const amount = prompt(`Konbe Minit ${provider.toUpperCase()} w ap voye? (Min: 50 HTG)`);
        
        if (amount && amount >= 50) {
            calculateEchanj(parseFloat(amount), userData);
        } else if (amount) {
            alert("Montan minimòm lan se 50 HTG.");
        }
    };
}

function calculateEchanj(amount, userData) {
    const systemFeePercent = 16.5;
    const fee = (amount * systemFeePercent) / 100;
    
    // Rabè 9.5 si itilizatè a gen yon sponsor (referral)
    let discount = 0;
    const hasSponsor = userData.referredBy && userData.referredBy !== "";
    
    if (hasSponsor) {
        discount = 9.5;
        document.getElementById('box-rabe-premium').classList.remove('hidden');
    } else {
        document.getElementById('box-rabe-premium').classList.add('hidden');
    }

    const totalToReceive = (amount - fee) + discount;

    // Ranpli Modal la
    document.getElementById('sum-minit').innerText = amount.toFixed(2) + " HTG";
    document.getElementById('sum-fre').innerText = "-" + fee.toFixed(2) + " HTG";
    document.getElementById('sum-rabe').innerText = "+" + discount.toFixed(2) + " HTG";
    document.getElementById('sum-total').innerText = totalToReceive.toFixed(2) + " HTG";

    // Louvri Modal la
    document.getElementById('modal-confirm-echanj').classList.remove('hidden');
    
    // Sove done tanporè pou konfimasyon final
    window.currentTransaction = {
        amount: amount,
        fee: fee,
        receive: totalToReceive,
        provider: window.lastProvider
    };
}

window.femenModalEchanj = function() {
    document.getElementById('modal-confirm-echanj').classList.add('hidden');
};

