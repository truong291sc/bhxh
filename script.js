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
    incomeInput.addEventListener('input', formatCurrencyInput);
    incomeInput.addEventListener('blur', function() {
        formatCurrencyInput.call(this);
        adjustIncomeToStep();
    });
    incomeInput.addEventListener('focus', function() {
        formatCurrencyInput.call(this);
    });
    
    // Set placeholder with formatted example
    incomeInput.placeholder = 'Tối thiểu 1.500.000đ';

    const printBtn = document.getElementById('printPdfBtn');
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            const resultCard = document.getElementById('resultCard');
            // Chỉ lấy phần nội dung kết quả, không lấy nút in
            const resultContent = resultCard.querySelector('.result-content');
            html2canvas(resultContent).then(function(canvas) {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new window.jspdf.jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                // Tính toán kích thước ảnh để fit vào trang A4
                const imgWidth = pageWidth - 40;
                const imgHeight = canvas.height * imgWidth / canvas.width;
                pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
                // Tạo blob và mở tab mới (cách tương thích mọi trình duyệt)
                const blob = pdf.output('blob');
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
            });
        });
    }
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

// Format currency input with dots
function formatCurrencyInput() {
    let value = this.value.replace(/[.,]/g, '');
    value = value.replace(/\D/g, '');
    
    if (value) {
        value = parseInt(value);
        // Luôn dùng dấu chấm ngăn cách hàng nghìn
        this.value = value.toLocaleString('en-US').replace(/,/g, '.');
        
        // Trigger validation feedback
        if (value >= MIN_INCOME && value % INCOME_STEP === 0) {
            this.style.borderColor = '#2aa3dc';
        } else {
            this.style.borderColor = '#e1e5e9';
        }
    } else {
        this.value = '';
        this.style.borderColor = '#e1e5e9';
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

// Hàm tính mức đóng một lần cho n năm về sau
function tinhMucDongMotLan(TNi, r, n, stateSupportRate, localSupportRate, securitySupportRate) {
    let tong = 0;
    const MIN_INCOME = 1500000;
    const CONTRIBUTION_RATE = 0.22;
    // Tổng tỷ lệ hỗ trợ
    const totalSupportRate = stateSupportRate + localSupportRate + securitySupportRate;
    for (let i = 1; i <= n * 12; i++) {
        // Phần được hỗ trợ chỉ tính trên mức chuẩn hộ nghèo
        const supportedPart = Math.min(TNi, MIN_INCOME);
        const hoTro = supportedPart * CONTRIBUTION_RATE * totalSupportRate;
        const dongThang = TNi * CONTRIBUTION_RATE - hoTro;
        tong += dongThang / Math.pow(1 + r, i - 1);
    }
    return tong;
}

function tinhMucDongMotLanGoc(TNi, r, n) {
    let tong = 0;
    for (let i = 1; i <= n * 12; i++) {
        tong += (TNi * 0.22) / Math.pow(1 + r, i - 1);
    }
    return tong;
}

function tinhTongHoTro(n, stateSupportRate, localSupportRate, securitySupportRate) {
    const MIN_INCOME = 1500000;
    const CONTRIBUTION_RATE = 0.22;
    const totalSupportRate = stateSupportRate + localSupportRate + securitySupportRate;
    return n * 12 * (MIN_INCOME * CONTRIBUTION_RATE * totalSupportRate);
}

// Display result
function displayResult(result) {
    // Update summary values
    document.getElementById('selectedIncome').textContent = formatCurrency(result.income);
    document.getElementById('personalContribution').textContent = formatCurrency(result.personalContribution);
    document.getElementById('stateSupport').textContent = formatCurrency(result.stateSupport);
    document.getElementById('localSupportResult').textContent = formatCurrency(result.localSupportAmount);
    document.getElementById('securitySupportResult').textContent = formatCurrency(result.securitySupportAmount);
    document.getElementById('totalSupport').textContent = formatCurrency(result.totalSupport);
    document.getElementById('actualPayment').textContent = formatCurrency(result.actualPayment);
    
    // Update payment breakdown
    document.getElementById('monthly1').textContent = formatCurrency(result.paymentBreakdown.monthly1);
    document.getElementById('monthly3').textContent = formatCurrency(result.paymentBreakdown.monthly3);
    document.getElementById('monthly6').textContent = formatCurrency(result.paymentBreakdown.monthly6);
    document.getElementById('monthly12').textContent = formatCurrency(result.paymentBreakdown.monthly12);

    // Bổ sung hiển thị mức đóng một lần cho 2, 3, 4, 5 năm
    const r = 0.00322; // Lãi suất 0.322%/tháng
    const TNi = result.income;
    // Lấy tỷ lệ hỗ trợ (dạng số thập phân)
    const stateSupportRate = result.stateSupport / (1500000 * 0.22) || 0;
    const localSupportRate = result.localSupportAmount / (1500000 * 0.22) || 0;
    const securitySupportRate = result.securitySupportAmount / (1500000 * 0.22) || 0;
    [2,3,4,5].forEach((n) => {
        // Tính MD1 (chưa trừ hỗ trợ)
        const md1 = tinhMucDongMotLanGoc(TNi, r, n);
        // Tính tổng hỗ trợ
        const hoTroNSNN = n * 12 * (1500000 * 0.22 * stateSupportRate);
        const hoTroNSDP = n * 12 * (1500000 * 0.22 * localSupportRate);
        const hoTroANCS = n * 12 * (1500000 * 0.22 * securitySupportRate);
        const tongHoTro = hoTroNSNN + hoTroNSDP + hoTroANCS;
        // Số tiền thực nộp
        const thucNop = md1 - tongHoTro;
        document.getElementById('oneTime'+n).textContent = formatCurrency(thucNop);
        // Hiển thị chi tiết
        let detail = `<hr style='margin:8px 0;'>`;
        detail += `<div>Giảm trừ theo phương thức: ${formatCurrency(md1 - TNi * 0.22 * n * 12)}</div>`;
        if (hoTroNSNN > 0) detail += `<div>Hỗ trợ NSNN: ${formatCurrency(hoTroNSNN)}</div>`;
        if (hoTroNSDP > 0) detail += `<div>Hỗ trợ NSĐP: ${formatCurrency(hoTroNSDP)}</div>`;
        if (hoTroANCS > 0) detail += `<div>Hỗ trợ ANCS: ${formatCurrency(hoTroANCS)}</div>`;
        document.getElementById('oneTime'+n+'Detail').innerHTML = detail;
    });
    
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
    
    // Clear input value
    incomeInput.value = '';
    
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