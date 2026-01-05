// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Status configurations
const statusConfig = {
    pending: {
        text: 'تم التقديم',
        description: 'تم استلام طلبك وسيتم مراجعته قريباً',
        icon: 'fas fa-check-circle',
        badgeClass: 'bg-info',
        alertClass: 'alert-info'
    },
    submitted: {
        text: 'تم التقديم',
        description: 'تم استلام طلبك وسيتم مراجعته قريباً',
        icon: 'fas fa-check-circle',
        badgeClass: 'bg-info',
        alertClass: 'alert-info'
    },
    under_review: {
        text: 'قيد المراجعة',
        description: 'يقوم فريقنا بمراجعة طلبك والتحقق من المعلومات',
        icon: 'fas fa-hourglass-half',
        badgeClass: 'bg-warning',
        alertClass: 'alert-warning'
    },
    approved: {
        text: 'تمت الموافقة',
        description: 'تمت الموافقة على طلبك وسيتم نشره للمتبرعين',
        icon: 'fas fa-check-double',
        badgeClass: 'bg-success',
        alertClass: 'alert-success'
    },
    active: {
        text: 'نشط',
        description: 'طلبك نشط حالياً ويستقبل التبرعات',
        icon: 'fas fa-heart-pulse',
        badgeClass: 'bg-success',
        alertClass: 'alert-success'
    },
    completed: {
        text: 'مكتمل',
        description: 'تم الوصول للمبلغ المطلوب! شكراً للمتبرعين الكرام',
        icon: 'fas fa-trophy',
        badgeClass: 'bg-primary',
        alertClass: 'alert-primary'
    },
    rejected: {
        text: 'مرفوض',
        description: 'عذراً، لم يتم الموافقة على طلبك. يمكنك التواصل معنا للمزيد من المعلومات',
        icon: 'fas fa-times-circle',
        badgeClass: 'bg-danger',
        alertClass: 'alert-danger'
    },
    cancelled: {
        text: 'ملغى',
        description: 'تم إلغاء الطلب',
        icon: 'fas fa-ban',
        badgeClass: 'bg-secondary',
        alertClass: 'alert-secondary'
    }
};

// Urgency level configurations
const urgencyConfig = {
    low: { text: 'عادي', class: 'bg-secondary' },
    medium: { text: 'مهم', class: 'bg-info' },
    high: { text: 'عاجل', class: 'bg-warning' },
    critical: { text: 'طارئ', class: 'bg-danger' }
};

// Get authentication token
function getAuthToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Type mapping for Arabic display
const typeMapping = {
    'education': 'تعليم',
    'health': 'صحة',
    'living': 'معيشة',
    'sponsoring': 'كفالة',
    'emergency': 'طوارئ',
    'other': 'أخرى'
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = getAuthToken();
    if (!token) {
        showError('يجب تسجيل الدخول أولاً لعرض طلبات التبرع');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    // Check if there's a request ID in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const requestId = urlParams.get('id');
    
    if (requestId) {
        // Load specific request
        loadRequestById(requestId);
    } else {
        // Load all user's requests and display the first one
        loadUserRequests();
    }
});

// Load all user's donation requests
async function loadUserRequests() {
    showLoading();
    
    const token = getAuthToken();
    
    try {
        const response = await fetch(`${API_BASE_URL}/donation-requests/my-requests`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                showError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى');
                setTimeout(() => {
                    localStorage.removeItem('token');
                    sessionStorage.removeItem('token');
                    window.location.href = 'login.html';
                }, 2000);
                return;
            }
            throw new Error('فشل في تحميل طلبات التبرع');
        }

        const data = await response.json();
        
        if (data.success && data.donationRequests && data.donationRequests.length > 0) {
            // Transform and display the first request
            const transformedRequest = transformRequestData(data.donationRequests[0]);
            displayRequest(transformedRequest);
            
            // Optionally, you can add UI to switch between multiple requests
            if (data.donationRequests.length > 1) {
                displayRequestSelector(data.donationRequests);
            }
        } else {
            showNoRequests();
        }
    } catch (error) {
        console.error('Error loading user requests:', error);
        showError('حدث خطأ أثناء تحميل طلبات التبرع. يرجى المحاولة مرة أخرى');
    }
}

// Load request by ID
async function loadRequestById(requestId) {
    showLoading();
    
    const token = getAuthToken();
    
    try {
        const response = await fetch(`${API_BASE_URL}/donation-requests/${requestId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                showError('لم يتم العثور على طلب التبرع');
                return;
            }
            if (response.status === 401) {
                showError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى');
                setTimeout(() => {
                    localStorage.removeItem('token');
                    sessionStorage.removeItem('token');
                    window.location.href = 'login.html';
                }, 2000);
                return;
            }
            throw new Error('فشل في تحميل طلب التبرع');
        }

        const requestData = await response.json();
        const transformedRequest = transformRequestData(requestData);
        displayRequest(transformedRequest);
    } catch (error) {
        console.error('Error loading request:', error);
        showError('حدث خطأ أثناء تحميل طلب التبرع. يرجى المحاولة مرة أخرى');
    }
}

// Transform API data to match UI format
function transformRequestData(apiData) {
    // Calculate status and generate timeline based on API data
    const timeline = generateTimeline(apiData);
    
    return {
        id: apiData._id,
        type: apiData.requestType,
        typeName: typeMapping[apiData.requestType] || apiData.requestType,
        status: apiData.status,
        submissionDate: apiData.createdAt,
        targetAmount: apiData.totalAmount || apiData.dynamicFields?.totalAmount || 0,
        raisedAmount: apiData.totalDonations || 0,
        applicant: {
            firstName: apiData.firstName,
            lastName: apiData.lastName,
            city: apiData.city,
            email: apiData.email
        },
        urgency: apiData.urgencyLevel,
        donations: [], // Will be populated from donations API if available
        donorsCount: apiData.donationsCount || 0,
        timeline: timeline
    };
}

// Generate timeline based on request status and dates
function generateTimeline(apiData) {
    const timeline = [];
    
    // Submitted status (always present)
    timeline.push({
        status: 'submitted',
        date: apiData.createdAt,
        time: formatTime(apiData.createdAt),
        description: 'تم تقديم الطلب بنجاح'
    });
    
    // Pending status
    if (apiData.status === 'pending' || apiData.status === 'under_review' || 
        apiData.status === 'approved' || apiData.status === 'completed') {
        timeline.push({
            status: 'pending',
            date: apiData.createdAt,
            time: formatTime(apiData.createdAt),
            description: 'في انتظار المراجعة'
        });
    }
    
    // Under review status
    if (apiData.status === 'under_review' || apiData.status === 'approved' || apiData.status === 'completed') {
        const reviewDate = apiData.reviewedAt || apiData.updatedAt;
        timeline.push({
            status: 'under_review',
            date: reviewDate,
            time: formatTime(reviewDate),
            description: 'قيد المراجعة من قبل الفريق'
        });
    }
    
    // Approved/Active status
    if (apiData.status === 'approved' || apiData.status === 'completed') {
        const approvalDate = apiData.reviewedAt || apiData.updatedAt;
        timeline.push({
            status: 'approved',
            date: approvalDate,
            time: formatTime(approvalDate),
            description: 'تمت الموافقة على الطلب'
        });
        
        timeline.push({
            status: 'active',
            date: approvalDate,
            time: formatTime(approvalDate),
            description: 'الطلب نشط ويستقبل التبرعات'
        });
    }
    
    // Completed status
    if (apiData.status === 'completed') {
        timeline.push({
            status: 'completed',
            date: apiData.updatedAt,
            time: formatTime(apiData.updatedAt),
            description: 'تم الوصول للمبلغ المطلوب'
        });
    }
    
    // Rejected status
    if (apiData.status === 'rejected') {
        const rejectionDate = apiData.reviewedAt || apiData.updatedAt;
        timeline.push({
            status: 'rejected',
            date: rejectionDate,
            time: formatTime(rejectionDate),
            description: apiData.adminNotes || 'لم يتم الموافقة على الطلب'
        });
    }
    
    return timeline;
}

// Format time from date string
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-PS', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
}

// Show error message
function showError(message) {
    document.getElementById('loadingSpinner').classList.add('d-none');
    document.getElementById('requestDetails').classList.add('d-none');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger text-center my-5';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
        <h4>${message}</h4>
    `;
    
    const container = document.querySelector('.container');
    container.appendChild(errorDiv);
}

// Show no requests message
function showNoRequests() {
    document.getElementById('loadingSpinner').classList.add('d-none');
    document.getElementById('requestDetails').classList.add('d-none');
    
    const noRequestsDiv = document.createElement('div');
    noRequestsDiv.className = 'alert alert-info text-center my-5';
    noRequestsDiv.innerHTML = `
        <i class="fas fa-inbox fa-3x mb-3"></i>
        <h4>لا توجد طلبات تبرع</h4>
        <p>لم تقم بتقديم أي طلبات تبرع بعد</p>
        <a href="donation-type-selection.html" class="btn btn-primary mt-3">
            <i class="fas fa-plus ms-2"></i>
            تقديم طلب تبرع جديد
        </a>
    `;
    
    const container = document.querySelector('.container');
    container.appendChild(noRequestsDiv);
}

// Display request selector if user has multiple requests
function displayRequestSelector(requests) {
    const selectorHTML = `
        <div class="row mb-4">
            <div class="col-12">
                <div class="card shadow-sm">
                    <div class="card-body">
                        <h6 class="mb-3">
                            <i class="fas fa-list ms-2"></i>
                            طلباتك الأخرى (${requests.length})
                        </h6>
                        <div class="d-flex flex-wrap gap-2">
                            ${requests.map((req, index) => `
                                <button class="btn btn-outline-primary btn-sm" onclick="loadRequestById('${req._id}')">
                                    طلب ${index + 1} - ${typeMapping[req.requestType]}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const requestDetails = document.getElementById('requestDetails');
    requestDetails.insertAdjacentHTML('afterbegin', selectorHTML);
}

// Show loading spinner
function showLoading() {
    document.getElementById('loadingSpinner').classList.remove('d-none');
    document.getElementById('requestDetails').classList.add('d-none');
}

// Display request details
function displayRequest(request) {
    document.getElementById('loadingSpinner').classList.add('d-none');
    document.getElementById('requestDetails').classList.remove('d-none');

    // Update status banner
    updateStatusBanner(request);

    // Update request information
    document.getElementById('displayRequestId').textContent = request.id;
    document.getElementById('requestType').textContent = request.typeName;
    document.getElementById('submissionDate').textContent = formatDate(request.submissionDate);
    document.getElementById('targetAmount').textContent = formatCurrency(request.targetAmount);
    
    // Update urgency level
    const urgency = urgencyConfig[request.urgency];
    const urgencyEl = document.getElementById('urgencyLevel');
    urgencyEl.textContent = urgency.text;
    urgencyEl.className = `badge ${urgency.class}`;

    // Update applicant information
    document.getElementById('applicantName').textContent = `${request.applicant.firstName} ${request.applicant.lastName}`;
    document.getElementById('applicantCity').textContent = request.applicant.city;
    document.getElementById('applicantEmail').textContent = request.applicant.email;

    // Update progress
    updateProgress(request);

    // Display donations
    displayDonations(request.donations);

    // Display timeline
    displayTimeline(request.timeline);

    // Scroll to results
    document.getElementById('requestDetails').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Update status banner
function updateStatusBanner(request) {
    const status = statusConfig[request.status];
    const banner = document.getElementById('statusBanner');
    
    banner.className = `alert ${status.alertClass}`;
    document.getElementById('statusIcon').className = `${status.icon} ms-2`;
    document.getElementById('statusText').textContent = status.text;
    document.getElementById('statusDescription').textContent = status.description;
    
    const badge = document.getElementById('statusBadge');
    badge.className = `badge fs-5 ${status.badgeClass}`;
    badge.textContent = status.text;
}

// Update progress display
function updateProgress(request) {
    const percentage = Math.min(100, Math.round((request.raisedAmount / request.targetAmount) * 100));
    const remaining = Math.max(0, request.targetAmount - request.raisedAmount);

    // Update stats
    document.getElementById('raisedAmount').textContent = formatCurrency(request.raisedAmount);
    document.getElementById('progressPercentage').textContent = `${percentage}%`;
    document.getElementById('donorsCount').textContent = request.donorsCount || 0;
    document.getElementById('remainingAmount').textContent = `المتبقي: ${formatCurrency(remaining)}`;

    // Update progress bar
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${percentage}%`;
    progressBar.setAttribute('aria-valuenow', percentage);
    document.getElementById('progressBarText').textContent = `${percentage}%`;

    // Change color based on progress
    if (percentage >= 100) {
        progressBar.classList.remove('bg-warning', 'bg-success');
        progressBar.classList.add('bg-primary');
    } else if (percentage >= 50) {
        progressBar.classList.remove('bg-warning', 'bg-primary');
        progressBar.classList.add('bg-success');
    } else {
        progressBar.classList.remove('bg-success', 'bg-primary');
        progressBar.classList.add('bg-warning');
    }
}

// Display donations list
function displayDonations(donations) {
    const donationsList = document.getElementById('donationsList');
    
    if (!donations || donations.length === 0) {
        donationsList.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-heart-broken fa-3x mb-3 opacity-50"></i>
                <p class="mb-0">لا توجد تبرعات بعد</p>
                <small>شارك رابط طلبك لجمع التبرعات</small>
            </div>
        `;
        return;
    }

    let html = '<div class="list-group list-group-flush">';
    
    // Show only last 5 donations
    const recentDonations = donations.slice(0, 5);
    
    recentDonations.forEach(donation => {
        html += `
            <div class="list-group-item border-0 px-0">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <div class="bg-success text-white rounded-circle p-2 ms-3" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-hand-holding-heart"></i>
                        </div>
                        <div>
                            <strong class="d-block">${donation.donor}</strong>
                            <small class="text-muted">
                                <i class="fas fa-calendar ms-1"></i>
                                ${formatDate(donation.date)} - ${donation.time}
                            </small>
                        </div>
                    </div>
                    <div>
                        <span class="badge bg-success fs-6">${formatCurrency(donation.amount)}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    if (donations.length > 5) {
        html += `
            <div class="list-group-item border-0 px-0 text-center">
                <small class="text-muted">
                    <i class="fas fa-ellipsis-h ms-1"></i>
                    و ${donations.length - 5} تبرعات أخرى
                </small>
            </div>
        `;
    }
    
    html += '</div>';
    donationsList.innerHTML = html;
}

// Display status timeline
function displayTimeline(timeline) {
    const timelineContainer = document.getElementById('statusTimeline');
    
    let html = '<div class="timeline">';
    
    timeline.forEach((item, index) => {
        const status = statusConfig[item.status];
        const isLast = index === timeline.length - 1;
        
        html += `
            <div class="timeline-item ${isLast ? 'active' : ''}">
                <div class="timeline-marker">
                    <i class="${status.icon}"></i>
                </div>
                <div class="timeline-content">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                        <strong class="text-primary">${status.text}</strong>
                        <small class="text-muted">
                            ${formatDate(item.date)} - ${item.time}
                        </small>
                    </div>
                    <p class="mb-0 text-muted">${item.description}</p>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    timelineContainer.innerHTML = html;
}

// Format currency
function formatCurrency(amount) {
    return `${amount.toLocaleString('ar-PS')} ₪`;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('ar', options);
}

// Share request functions
function shareRequest(platform) {
    const requestId = document.getElementById('displayRequestId').textContent;
    const url = `${window.location.origin}${window.location.pathname}?id=${requestId}`;
    const text = `ساعد في تحقيق هذا الطلب على Give Hope - ${requestId}`;
    
    let shareUrl = '';
    
    switch(platform) {
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            break;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
    }
}

// Copy link to clipboard
function copyLink() {
    const requestId = document.getElementById('displayRequestId').textContent;
    const url = `${window.location.origin}${window.location.pathname}?id=${requestId}`;
    
    // Create temporary input
    const tempInput = document.createElement('input');
    tempInput.value = url;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    // Show feedback
    const btn = event.target.closest('button');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check ms-1"></i> تم النسخ!';
    btn.classList.remove('btn-outline-secondary');
    btn.classList.add('btn-success');
    
    setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.classList.remove('btn-success');
        btn.classList.add('btn-outline-secondary');
    }, 2000);
}
