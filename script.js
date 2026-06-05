// Constants
const MIN_INCOME = 1500000;
const CONTRIBUTION_RATE = 0.22;
const INCOME_STEP = 50000;
const INVESTMENT_RATE = 0.0031; // Lãi suất 0.31%/tháng
const BASE_CONTRIBUTION = MIN_INCOME * CONTRIBUTION_RATE;

const STATE_SUPPORT_RATES = {
    ngheo: 0.50,
    canNgheo: 0.40,
    danToc: 0.30,
    khac: 0.20
};

const ONE_TIME_YEARS = [2, 3, 4, 5];

const SUPPLEMENTARY_INFO = [
    'Thời hạn đóng bảo hiểm xã hội tự nguyện được quy định như sau:',
    '- Trong tháng đối với phương thức đóng hằng tháng;',
    '- Trong 03 tháng đối với phương thức đóng 03 tháng một lần;',
    '- Trong 04 tháng đầu đối với phương thức đóng 06 tháng một lần;',
    '- Trong 07 tháng đầu đối với phương thức đóng 12 tháng một lần;',
    '- Tại thời điểm đăng ký phương thức đóng và mức thu nhập tháng làm căn cứ đóng đối với trường hợp đóng cho những năm về sau và đóng cho những năm còn thiếu để hưởng lương hưu.',
    'Người tham gia được thay đổi phương thức đóng, thay đổi mức thu nhập làm căn cứ đóng sau khi đã hoàn thành phương thức cũ.',
    'Người tham gia được Ngân sách Nhà nước hỗ trợ một phần tiền đóng tối đa không quá 10 năm, người tham gia thuộc nhiều đối tượng hỗ trợ sẽ được hỗ trợ theo mức cao nhất.'
];

// DOM Elements
const form = document.getElementById('bhxhForm');
const resultCard = document.getElementById('resultCard');
const incomeInput = document.getElementById('income');
const objectTypeSelect = document.getElementById('objectType');
const localSupportSelect = document.getElementById('localSupport');
const securityForceSelect = document.getElementById('securityForce');

const resultElements = {
    selectedIncome: document.getElementById('selectedIncome'),
    personalContribution: document.getElementById('personalContribution'),
    stateSupport: document.getElementById('stateSupport'),
    localSupportResult: document.getElementById('localSupportResult'),
    securitySupportResult: document.getElementById('securitySupportResult'),
    totalSupport: document.getElementById('totalSupport'),
    actualPayment: document.getElementById('actualPayment'),
    monthly1: document.getElementById('monthly1'),
    monthly3: document.getElementById('monthly3'),
    monthly6: document.getElementById('monthly6'),
    monthly12: document.getElementById('monthly12'),
    infoList: document.getElementById('infoList')
};

ONE_TIME_YEARS.forEach((year) => {
    resultElements[`oneTime${year}`] = document.getElementById(`oneTime${year}`);
    resultElements[`oneTime${year}Detail`] = document.getElementById(`oneTime${year}Detail`);
});

let lastResult = null;

const PDF_MARGIN = 42.5;
const PDF_LINE = 15;
const PDF_SECTION_GAP = 8;
const PDF_FONT_URLS = {
    regular: 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Regular.ttf',
    bold: 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Bold.ttf'
};

let pdfFontCache = null;

document.addEventListener('DOMContentLoaded', () => {
    form.addEventListener('submit', handleFormSubmit);
    incomeInput.addEventListener('input', formatCurrencyInput);
    incomeInput.addEventListener('blur', () => {
        formatCurrencyInput.call(incomeInput);
        adjustIncomeToStep();
    });
    incomeInput.addEventListener('focus', () => formatCurrencyInput.call(incomeInput));

    const printBtn = document.getElementById('printPdfBtn');
    if (printBtn) {
        printBtn.addEventListener('click', handlePrintPdf);
    }
});

function parseIncomeValue(value) {
    return parseInt(String(value).replace(/[.,]/g, ''), 10) || 0;
}

function formatIncomeValue(value) {
    return value.toLocaleString('en-US').replace(/,/g, '.');
}

function updateIncomeBorder(value) {
    incomeInput.style.borderColor =
        value >= MIN_INCOME && value % INCOME_STEP === 0 ? '#2aa3dc' : '#e1e5e9';
}

function validateIncome() {
    const income = parseIncomeValue(incomeInput.value);
    const formGroup = incomeInput.closest('.form-group');
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

function formatCurrencyInput() {
    const digits = this.value.replace(/\D/g, '');

    if (!digits) {
        this.value = '';
        this.style.borderColor = '#e1e5e9';
        return;
    }

    const value = parseInt(digits, 10);
    this.value = formatIncomeValue(value);
    updateIncomeBorder(value);
}

function adjustIncomeToStep() {
    const income = parseIncomeValue(incomeInput.value);
    if (income && income % INCOME_STEP !== 0) {
        const adjustedIncome = Math.round(income / INCOME_STEP) * INCOME_STEP;
        if (adjustedIncome >= MIN_INCOME) {
            incomeInput.value = formatIncomeValue(adjustedIncome);
            updateIncomeBorder(adjustedIncome);
        }
    }
}

function showError(formGroup, message) {
    formGroup.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i>${message}`;
    formGroup.appendChild(errorDiv);
}

function removeError(formGroup) {
    formGroup.classList.remove('error');
    formGroup.querySelector('.error-message')?.remove();
}

function handleFormSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    const result = calculateBHXH(getFormData());
    lastResult = result;
    displayResult(result);
    showResultCard();
}

function validateForm() {
    let isValid = validateIncome();

    if (!objectTypeSelect.value) {
        showError(objectTypeSelect.closest('.form-group'), 'Vui lòng chọn giá trị này');
        isValid = false;
    } else {
        removeError(objectTypeSelect.closest('.form-group'));
    }

    return isValid;
}

function getFormData() {
    return {
        income: parseIncomeValue(incomeInput.value),
        objectType: objectTypeSelect.value,
        localSupport: parseInt(localSupportSelect.value, 10),
        securityForce: parseInt(securityForceSelect.value, 10)
    };
}

function calculateSupportAmount(rate) {
    return BASE_CONTRIBUTION * rate;
}

function presentValueAnnuity(monthlyAmount, rate, months) {
    const factor = 1 + rate;
    const pow = Math.pow(factor, months);
    return monthlyAmount * (pow - 1) / (rate * Math.pow(factor, months - 1));
}

function calculateOneTimePayments(income, supportRates) {
    const monthlyContribution = income * CONTRIBUTION_RATE;
    const totalSupportRate = supportRates.state + supportRates.local + supportRates.security;

    return ONE_TIME_YEARS.map((years) => {
        const months = years * 12;
        const gross = presentValueAnnuity(monthlyContribution, INVESTMENT_RATE, months);
        const totalSupport = months * BASE_CONTRIBUTION * totalSupportRate;
        const actualPayment = gross - totalSupport;
        const savings = gross - monthlyContribution * months;

        return { years, actualPayment, savings };
    });
}

function calculateBHXH(data) {
    const { income, objectType, localSupport, securityForce } = data;

    const stateSupportRate = STATE_SUPPORT_RATES[objectType];
    const localSupportRate = localSupport / 100;
    const securitySupportRate = securityForce / 100;

    const personalContribution = income * CONTRIBUTION_RATE;
    const stateSupport = calculateSupportAmount(stateSupportRate);
    const localSupportAmount = calculateSupportAmount(localSupportRate);
    const securitySupportAmount = calculateSupportAmount(securitySupportRate);
    const totalSupport = stateSupport + localSupportAmount + securitySupportAmount;
    const actualPayment = personalContribution - totalSupport;

    return {
        income,
        personalContribution,
        stateSupport,
        localSupportAmount,
        securitySupportAmount,
        totalSupport,
        actualPayment,
        paymentBreakdown: {
            monthly1: actualPayment,
            monthly3: actualPayment * 3,
            monthly6: actualPayment * 6,
            monthly12: actualPayment * 12
        },
        oneTimePayments: calculateOneTimePayments(income, {
            state: stateSupportRate,
            local: localSupportRate,
            security: securitySupportRate
        })
    };
}

function displayResult(result) {
    resultElements.selectedIncome.textContent = formatCurrency(result.income);
    resultElements.personalContribution.textContent = formatCurrency(result.personalContribution);
    resultElements.stateSupport.textContent = formatCurrency(result.stateSupport);
    resultElements.localSupportResult.textContent = formatCurrency(result.localSupportAmount);
    resultElements.securitySupportResult.textContent = formatCurrency(result.securitySupportAmount);
    resultElements.totalSupport.textContent = formatCurrency(result.totalSupport);
    resultElements.actualPayment.textContent = formatCurrency(result.actualPayment);

    resultElements.monthly1.textContent = formatCurrency(result.paymentBreakdown.monthly1);
    resultElements.monthly3.textContent = formatCurrency(result.paymentBreakdown.monthly3);
    resultElements.monthly6.textContent = formatCurrency(result.paymentBreakdown.monthly6);
    resultElements.monthly12.textContent = formatCurrency(result.paymentBreakdown.monthly12);

    result.oneTimePayments.forEach(({ years, actualPayment, savings }) => {
        resultElements[`oneTime${years}`].textContent = formatCurrency(actualPayment);
        resultElements[`oneTime${years}Detail`].innerHTML =
            `<div>Tiết kiệm: ${formatCurrency(savings)}</div>`;
    });

    renderSupplementaryInfo();
}

function renderSupplementaryInfo() {
    const infoList = resultElements.infoList;
    infoList.innerHTML = '';

    SUPPLEMENTARY_INFO.forEach((info) => {
        if (info.startsWith('- ')) {
            const div = document.createElement('div');
            div.className = 'info-sub';
            div.textContent = info;
            infoList.appendChild(div);
        } else {
            const li = document.createElement('li');
            li.textContent = info;
            infoList.appendChild(li);
        }
    });
}

function showResultCard() {
    resultCard.classList.remove('hidden');
    resultCard.scrollIntoView({ behavior: 'auto', block: 'start' });
}

function resetForm() {
    form.reset();
    resultCard.classList.add('hidden');
    lastResult = null;

    document.querySelectorAll('.form-group').forEach(removeError);
    incomeInput.style.borderColor = '#e1e5e9';
    incomeInput.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
}

async function loadPdfFonts() {
    if (pdfFontCache) return pdfFontCache;

    const [regular, bold] = await Promise.all([
        fetch(PDF_FONT_URLS.regular).then((r) => r.arrayBuffer()),
        fetch(PDF_FONT_URLS.bold).then((r) => r.arrayBuffer())
    ]);

    pdfFontCache = {
        regular: arrayBufferToBase64(regular),
        bold: arrayBufferToBase64(bold)
    };
    return pdfFontCache;
}

function registerPdfFonts(pdf, fonts) {
    pdf.addFileToVFS('NotoSans-Regular.ttf', fonts.regular);
    pdf.addFileToVFS('NotoSans-Bold.ttf', fonts.bold);
    pdf.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
    pdf.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');
}

function getPdfPageWidth(pdf) {
    return pdf.internal.pageSize.getWidth();
}

function getPdfPageHeight(pdf) {
    return pdf.internal.pageSize.getHeight();
}

function ensurePdfSpace(pdf, y, needed) {
    if (y + needed > getPdfPageHeight(pdf) - PDF_MARGIN) {
        pdf.addPage();
        return PDF_MARGIN;
    }
    return y;
}

function pdfSetBlack(pdf) {
    pdf.setTextColor(0, 0, 0);
    pdf.setDrawColor(0, 0, 0);
}

function pdfWrappedText(pdf, y, text, left, right, fontSize, fontStyle = 'normal') {
    const maxWidth = right - left;
    const lineHeight = fontSize * 1.45;
    pdf.setFont('NotoSans', fontStyle);
    pdf.setFontSize(fontSize);
    pdfSetBlack(pdf);

    const lines = pdf.splitTextToSize(text, maxWidth);
    lines.forEach((line) => {
        y = ensurePdfSpace(pdf, y, lineHeight);
        pdf.text(line, left, y);
        y += lineHeight;
    });
    return y;
}

function pdfSectionTitle(pdf, y, title) {
    const pageWidth = getPdfPageWidth(pdf);
    y = ensurePdfSpace(pdf, y, 24);
    pdf.setFont('NotoSans', 'bold');
    pdf.setFontSize(12);
    pdfSetBlack(pdf);
    pdf.text(title, PDF_MARGIN, y);
    y += 6;
    pdf.setLineWidth(0.5);
    pdf.line(PDF_MARGIN, y, pageWidth - PDF_MARGIN, y);
    return y + PDF_SECTION_GAP;
}

function pdfDataRow(pdf, y, label, value, options = {}) {
    const pageWidth = getPdfPageWidth(pdf);
    const contentWidth = pageWidth - PDF_MARGIN * 2;
    const valueWidth = 120;
    const lineHeight = (options.fontSize || 11) * 1.35;

    pdf.setFont('NotoSans', options.bold ? 'bold' : 'normal');
    pdf.setFontSize(options.fontSize || 11);
    pdfSetBlack(pdf);

    const labelLines = pdf.splitTextToSize(label, contentWidth - valueWidth - 10);
    const rowHeight = Math.max(labelLines.length, 1) * lineHeight;
    y = ensurePdfSpace(pdf, y, rowHeight);

    labelLines.forEach((line, index) => {
        pdf.text(line, PDF_MARGIN, y + index * lineHeight);
    });
    pdf.text(value, pageWidth - PDF_MARGIN, y, { align: 'right' });

    return y + rowHeight + 2;
}

function buildResultPdf(result) {
    const pdf = new window.jspdf.jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    registerPdfFonts(pdf, pdfFontCache);

    const pageWidth = getPdfPageWidth(pdf);
    let y = PDF_MARGIN;

    pdf.setFont('NotoSans', 'bold');
    pdf.setFontSize(14);
    pdfSetBlack(pdf);
    pdf.text('BẢNG TÍNH MỨC ĐÓNG BHXH TỰ NGUYỆN', pageWidth / 2, y, { align: 'center' });
    y += 22;

    pdf.setFont('NotoSans', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Ngày in: ${new Date().toLocaleDateString('vi-VN')}`, pageWidth - PDF_MARGIN, y, { align: 'right' });
    y += 18;

    y = pdfSectionTitle(pdf, y, 'Kết quả tính toán');
    const summaryRows = [
        ['Mức thu nhập lựa chọn:', formatCurrency(result.income)],
        ['Mức đóng cá nhân (22%):', formatCurrency(result.personalContribution)],
        ['Hỗ trợ từ NSNN:', formatCurrency(result.stateSupport)],
        ['Hỗ trợ từ NSĐP:', formatCurrency(result.localSupportAmount)],
        ['Hỗ trợ người thuộc lực lượng ANCS:', formatCurrency(result.securitySupportAmount)],
        ['Tổng hỗ trợ:', formatCurrency(result.totalSupport)],
        ['Số tiền thực đóng:', formatCurrency(result.actualPayment)]
    ];
    summaryRows.forEach(([label, value], index) => {
        const isLast = index === summaryRows.length - 1;
        y = pdfDataRow(pdf, y, label, value, { bold: isLast, fontSize: isLast ? 12 : 11 });
    });

    y += 6;
    y = pdfSectionTitle(pdf, y, 'Chi tiết theo phương thức đóng');
    const paymentRows = [
        ['1 tháng:', formatCurrency(result.paymentBreakdown.monthly1)],
        ['3 tháng:', formatCurrency(result.paymentBreakdown.monthly3)],
        ['6 tháng:', formatCurrency(result.paymentBreakdown.monthly6)],
        ['12 tháng:', formatCurrency(result.paymentBreakdown.monthly12)]
    ];
    paymentRows.forEach(([label, value]) => {
        y = pdfDataRow(pdf, y, label, value);
    });

    y += 6;
    y = pdfSectionTitle(pdf, y, 'Mức đóng một lần cho nhiều năm về sau');
    result.oneTimePayments.forEach(({ years, actualPayment, savings }) => {
        y = pdfDataRow(pdf, y, `${years} năm:`, formatCurrency(actualPayment));
        y = pdfWrappedText(
            pdf, y,
            `Tiết kiệm: ${formatCurrency(savings)}`,
            PDF_MARGIN + 12,
            pageWidth - PDF_MARGIN,
            10
        );
        y += 4;
    });

    y += 6;
    y = pdfSectionTitle(pdf, y, 'Thông tin bổ sung');
    SUPPLEMENTARY_INFO.forEach((info) => {
        const indent = info.startsWith('- ') ? PDF_MARGIN + 12 : PDF_MARGIN;
        y = pdfWrappedText(pdf, y, info, indent, pageWidth - PDF_MARGIN, 10);
        y += 3;
    });

    return pdf;
}

async function handlePrintPdf() {
    if (!lastResult) {
        alert('Vui lòng tính toán trước khi in PDF.');
        return;
    }

    const printBtn = document.getElementById('printPdfBtn');
    const originalLabel = printBtn?.innerHTML;
    if (printBtn) {
        printBtn.disabled = true;
        printBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tạo PDF...';
    }

    try {
        await loadPdfFonts();
        const pdf = buildResultPdf(lastResult);
        const url = URL.createObjectURL(pdf.output('blob'));
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
        console.error(error);
        alert('Không thể tạo PDF. Vui lòng kiểm tra kết nối mạng và thử lại.');
    } finally {
        if (printBtn) {
            printBtn.disabled = false;
            printBtn.innerHTML = originalLabel;
        }
    }
}
