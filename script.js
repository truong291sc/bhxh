// Constants
const MIN_INCOME = 1500000; // Mức chuẩn hộ nghèo khu vực nông thôn
const CONTRIBUTION_RATE = 0.22; // 22% mức thu nhập
const INCOME_STEP = 50000; // Bước nhảy 50,000đ

// Hỗ trợ nhà nước theo loại đối tượng
const STATE_SUPPORT_RATES = {
    'ngheo': 0.50,      // Hộ nghèo, xã đảo, đặc khu: 50%
    'canNgheo': 0.40,   // Hộ cận nghèo: 40%
    'danToc': 0.30,     // Dân tộc thiểu số: 30%
    'khac': 0.20        // Đối tượng khác: 20%
};

// DOM Elements
const form = document.getElementById('bhxhForm');
const resultCard = document.getElementById('resultCard');
const incomeInput = document.getElementById('income');
const objectTypeSelect = document.getElementById('objectType');
const localSupportSelect = document.getElementById('localSupport');
const securityForceSelect = document.getElementById('securityForce');

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    form.addEventListener('submit', handleFormSubmit);
    incomeInput.addEventListener('input', validateIncome);
    incomeInput.addEventListener('blur', adjustIncomeToStep);
    incomeInput.addEventListener('input', formatCurrencyInput);
    incomeInput.addEventListener('focus', function() {
        // Format khi focus vào input
        let value = this.value.replace(/[.,]/g, '');
        if (value) {
            value = parseInt(value);
            this.value = value.toLocaleString('vi-VN');
        }
    });
});

// Validate income input
function validateIncome() {
    let value = incomeInput.value.replace(/[.,]/g, '');
    const income = parseInt(value);
    const formGroup = incomeInput.closest('.form-group');
    
    // Remove existing error
    removeError(formGroup);
    
    if (income < MIN_INCOME) {
        showError(formGroup, `Mức thu nhập phải tối thiểu ${formatCurrency(MIN_INCOME)}`);
        return false;
    }
    
    if (income % INCOME_STEP !== 0) {
        showError(formGroup, `Mức thu nhập phải chia hết cho ${formatCurrency(INCOME_STEP)}`);
        return false;
    }
    
    return true;
}

// Format currency input with commas
function formatCurrencyInput() {
    let value = this.value.replace(/[.,]/g, '');
    value = value.replace(/\D/g, '');
    
    if (value) {
        value = parseInt(value);
        this.value = value.toLocaleString('vi-VN');
    } else {
        this.value = '';
    }
}

// Adjust income to nearest valid step
function adjustIncomeToStep() {
    let value = incomeInput.value.replace(/[.,]/g, '');
    const income = parseInt(value);
    if (income && income % INCOME_STEP !== 0) {
        const adjustedIncome = Math.round(income / INCOME_STEP) * INCOME_STEP;
        if (adjustedIncome >= MIN_INCOME) {
            incomeInput.value = adjustedIncome.toLocaleString('vi-VN');
        }
    }
}

// Show error message
function showError(formGroup, message) {
    formGroup.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i>${message}`;
    formGroup.appendChild(errorDiv);
}

// Remove error message
function removeError(formGroup) {
    formGroup.classList.remove('error');
    const errorDiv = formGroup.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    // Get form data
    const formData = getFormData();
    
    // Calculate BHXH
    const result = calculateBHXH(formData);
    
    // Display result
    displayResult(result);
    
    // Show result card
    showResultCard();
}

// Validate form
function validateForm() {
    let isValid = true;
    
    // Validate income
    if (!validateIncome()) {
        isValid = false;
    }
    
    // Validate required fields
    const requiredFields = [objectTypeSelect];
    requiredFields.forEach(field => {
        if (!field.value) {
            const formGroup = field.closest('.form-group');
            showError(formGroup, 'Vui lòng chọn giá trị này');
            isValid = false;
        } else {
            removeError(field.closest('.form-group'));
        }
    });
    
    return isValid;
}

// Get form data
function getFormData() {
    let value = incomeInput.value.replace(/[.,]/g, '');
    return {
        income: parseInt(value),
        objectType: objectTypeSelect.value,
        localSupport: parseInt(localSupportSelect.value),
        securityForce: parseInt(securityForceSelect.value)
    };
}

// Calculate BHXH
function calculateBHXH(data) {
    const { income, objectType, localSupport, securityForce } = data;
    
    // Mức đóng cá nhân (22% mức thu nhập)
    const personalContribution = income * CONTRIBUTION_RATE;
    
    // Hỗ trợ nhà nước (dựa trên mức chuẩn hộ nghèo 1,500,000 VNĐ)
    const stateSupportRate = STATE_SUPPORT_RATES[objectType];
    const stateSupport = MIN_INCOME * CONTRIBUTION_RATE * stateSupportRate;
    
    // Hỗ trợ địa phương (dựa trên mức chuẩn hộ nghèo)
    const localSupportAmount = MIN_INCOME * CONTRIBUTION_RATE * (localSupport / 100);
    
    // Hỗ trợ an ninh cơ sở (dựa trên mức chuẩn hộ nghèo)
    const securitySupportAmount = MIN_INCOME * CONTRIBUTION_RATE * (securityForce / 100);
    
    // Tổng hỗ trợ
    const totalSupport = stateSupport + localSupportAmount + securitySupportAmount;
    
    // Số tiền thực đóng
    const actualPayment = personalContribution - totalSupport;
    
    // Tính theo phương thức đóng
    const paymentBreakdown = {
        monthly1: actualPayment,
        monthly3: actualPayment * 3,
        monthly6: actualPayment * 6,
        monthly12: actualPayment * 12
    };
    
    // Thông tin bổ sung
    const additionalInfo = generateAdditionalInfo(data, stateSupportRate);
    
    return {
        income,
        personalContribution,
        stateSupport,
        localSupportAmount,
        securitySupportAmount,
        totalSupport,
        actualPayment,
        paymentBreakdown,
        additionalInfo,
        stateSupportRate
    };
}

// Generate additional information
function generateAdditionalInfo(data, stateSupportRate) {
    const info = [];
    
    info.push(`Mức thu nhập lựa chọn: ${formatCurrency(data.income)}`);
    info.push(`Tỷ lệ đóng cá nhân: 22% mức thu nhập`);
    info.push(`Tỷ lệ hỗ trợ nhà nước: ${(stateSupportRate * 100).toFixed(0)}% của mức chuẩn hộ nghèo (${formatCurrency(MIN_INCOME)})`);
    info.push(`Mức hỗ trợ nhà nước: ${formatCurrency(MIN_INCOME * CONTRIBUTION_RATE * stateSupportRate)}`);
    
    if (data.localSupport > 0) {
        info.push(`Hỗ trợ địa phương: ${data.localSupport}% (${formatCurrency(MIN_INCOME * CONTRIBUTION_RATE * (data.localSupport / 100))})`);
    }
    
    if (data.securityForce > 0) {
        info.push(`Hỗ trợ an ninh cơ sở: ${data.securityForce}% (${formatCurrency(MIN_INCOME * CONTRIBUTION_RATE * (data.securityForce / 100))})`);
    }
    
    info.push(`Tổng hỗ trợ: ${formatCurrency(MIN_INCOME * CONTRIBUTION_RATE * (stateSupportRate + data.localSupport/100 + data.securityForce/100))}`);
    info.push('Người tham gia thuộc nhiều đối tượng hỗ trợ sẽ được hỗ trợ theo mức cao nhất');
    info.push('Có thể đóng theo các phương thức: 1, 3, 6 hoặc 12 tháng một lần');
    
    return info;
}

// Display result
function displayResult(result) {
    // Update summary values
    document.getElementById('selectedIncome').textContent = formatCurrency(result.income);
    document.getElementById('personalContribution').textContent = formatCurrency(result.personalContribution);
    document.getElementById('stateSupport').textContent = formatCurrency(result.stateSupport);
    document.getElementById('localSupport').textContent = formatCurrency(result.localSupportAmount);
    document.getElementById('securitySupport').textContent = formatCurrency(result.securitySupportAmount);
    document.getElementById('totalSupport').textContent = formatCurrency(result.totalSupport);
    document.getElementById('actualPayment').textContent = formatCurrency(result.actualPayment);
    
    // Update payment breakdown
    document.getElementById('monthly1').textContent = formatCurrency(result.paymentBreakdown.monthly1);
    document.getElementById('monthly3').textContent = formatCurrency(result.paymentBreakdown.monthly3);
    document.getElementById('monthly6').textContent = formatCurrency(result.paymentBreakdown.monthly6);
    document.getElementById('monthly12').textContent = formatCurrency(result.paymentBreakdown.monthly12);
    
    // Update additional info
    const infoList = document.getElementById('infoList');
    infoList.innerHTML = '';
    result.additionalInfo.forEach(info => {
        const li = document.createElement('li');
        li.textContent = info;
        infoList.appendChild(li);
    });
}

// Show result card
function showResultCard() {
    resultCard.classList.remove('hidden');
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Reset form
function resetForm() {
    form.reset();
    resultCard.classList.add('hidden');
    
    // Remove all errors
    document.querySelectorAll('.form-group').forEach(group => {
        removeError(group);
    });
    
    // Reset input border color
    incomeInput.style.borderColor = '#e1e5e9';
    
    // Force re-render of select elements
    localSupportSelect.style.display = 'none';
    localSupportSelect.offsetHeight; // Trigger reflow
    localSupportSelect.style.display = '';
    
    securityForceSelect.style.display = 'none';
    securityForceSelect.offsetHeight; // Trigger reflow
    securityForceSelect.style.display = '';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Add some interactive features
document.addEventListener('DOMContentLoaded', function() {
    // Add input validation feedback
    incomeInput.addEventListener('input', function() {
        let value = this.value.replace(/[.,]/g, '');
        value = parseInt(value);
        if (value >= MIN_INCOME && value % INCOME_STEP === 0) {
            this.style.borderColor = '#2aa3dc';
        } else {
            this.style.borderColor = '#e1e5e9';
        }
    });
    
    // Add tooltips for better UX
    addTooltips();
});

// Add tooltips
function addTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
}

function showTooltip(e) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = e.target.dataset.tooltip;
    tooltip.style.cssText = `
        position: absolute;
        background: #333;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 0.9rem;
        z-index: 1000;
        pointer-events: none;
        white-space: nowrap;
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = e.target.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
    
    e.target.tooltip = tooltip;
}

function hideTooltip(e) {
    if (e.target.tooltip) {
        e.target.tooltip.remove();
        e.target.tooltip = null;
    }
} 