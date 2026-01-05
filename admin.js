// جيب كل روابط الـ sidebar
  const links = document.querySelectorAll(".sidebar ul li a");

  // اسم الصفحة الحالية من الرابط 
  const currentPage = window.location.pathname.split("/").pop();

  // لف على كل الروابط وقارن
  links.forEach(link => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active"); 
    } else {
      link.classList.remove("active"); 
    }
  });


  document.getElementById("logoutBtn").addEventListener("click", function() {
  // مسح التوكن
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem('admin');
  sessionStorage.removeItem("token");
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('admin');


  // إعادة التوجيه لصفحة تسجيل الدخول
  window.location.href = "login.html";
});






// admin.js
console.log('admin.js loaded');

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token')|| sessionStorage.getItem('token'); // التوكن بعد تسجيل الدخول

    if (!token) {
        alert('يجب تسجيل الدخول أولاً!');
        window.location.href = 'login.html'; // إعادة توجيه لتسجيل الدخول
        return;
    }

    // جلب إحصائيات الـ Dashboard
    fetchDashboardStats(token);
    fetchLatestRequests(token);
    loadLatestDonations(token);

});

//dashboard
async function fetchDashboardStats(token) {
 try {
    
    const res = await fetch("http://localhost:5000/api/admin/dashboard", {
  headers: { Authorization: `Bearer ${token}` }
});

        const data = await res.json();
 // =============================
    // 1) إجمالي الطلبات
    // =============================
    const totalOrdersCard = document.querySelector(".stat-card:nth-child(1)");
    totalOrdersCard.querySelector(".card-value").textContent = data.totalOrders;

    const ordersChangeElem = totalOrdersCard.querySelector(".card-change");
    ordersChangeElem.querySelector("span").textContent =
      data.totalOrdersChange.percentage + "% عن الشهر الماضي";

    const ordersArrow = ordersChangeElem.querySelector("i");
    setChangeStyle(ordersChangeElem, ordersArrow, data.totalOrdersChange.direction);

     // =============================
    // الطلبات الجديدة
    // =============================
    const newOrdersCard = document.querySelector(".stat-card:nth-child(2)");

newOrdersCard.querySelector(".card-value").textContent =data.newOrders ?? 0;

const newOrdersChangeElem = newOrdersCard.querySelector(".card-change");
newOrdersChangeElem.querySelector("span").textContent =
  (data.newOrdersChange?.percentage ?? 0) + "% عن الشهر الماضي";

const newOrdersArrow = newOrdersChangeElem.querySelector("i");
setChangeStyle(newOrdersChangeElem, newOrdersArrow, data.newOrdersChange.direction);

    // =============================
    // 2) إجمالي التبرعات
    // =============================
    const donationsCard = document.getElementById("donationsCard");
    donationsCard.querySelector(".card-value").textContent =
      Number(data.totalDonations || 0).toLocaleString() + " ₪";

    const donationsChangeElem = donationsCard.querySelector(".card-change");
    donationsChangeElem.querySelector("span").textContent =
      data.totalDonationsChange.percentage + "% عن الشهر الماضي";

    const donationsArrow = donationsChangeElem.querySelector("i");
    setChangeStyle(donationsChangeElem, donationsArrow, data.totalDonationsChange.direction);

    // =============================
    // 3) الحالات المكتملة
    // =============================
    const completedCasesCard = document.getElementById("completedCasesCard");
    completedCasesCard.querySelector(".card-value").textContent = data.completedCases;

    const completedCasesChangeElem = completedCasesCard.querySelector(".card-change");
    completedCasesChangeElem.querySelector("span").textContent =
      data.completedCasesChange.percentage + "% عن الشهر الماضي";

    const completedCasesArrow = completedCasesChangeElem.querySelector("i");
    setChangeStyle(
      completedCasesChangeElem,
      completedCasesArrow,
      data.completedCasesChange.direction
    );

  } catch (err) {
    console.error("Failed to fetch dashboard stats:", err);
  }
}

function setChangeStyle(container, arrow, direction) {
  container.classList.remove("increase", "decrease");

  if (direction === "increase") {
    arrow.className = "fas fa-arrow-up";
    container.classList.add("increase");
  } else if (direction === "decrease") {
    arrow.className = "fas fa-arrow-down";
    container.classList.add("decrease");
  } else {
    arrow.className = "fas fa-minus";
  }
}
 async function fetchLatestRequests(token) {
  try {
    const res = await fetch("http://localhost:5000/api/admin/dashboard/latest-requests", {
      headers: { 'Authorization': `Bearer ${token}` }
    });
      
    const data = await res.json();

   const tbody = document.querySelector(".request-table tbody");
    tbody.innerHTML = "";

    // ✅ مهم
    const requests = data.latestRequests;

    // لو ما في ولا طلب
    if (!requests || requests.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;">
            لا توجد طلبات حالياً
          </td>
        </tr>
      `;
      return;
    }

    requests.forEach(request => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${request._id}</td>
        <td>${requestTypeMap[request.requestType] || 'غير محدد'}</td>
        <td>${request.firstName} ${request.lastName}</td>
        <td>${request.totalDonations || 0} ₪</td>
        <td>${new Date(request.createdAt).toLocaleDateString()}</td>
        <td>
          <span class="status status-style">
            ${statusMap[request.status] || request.status}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-primary border-2 btn-style btn-transform" onclick="openviewDetailsModal('${request._id}')">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-success border-2 btn-style btn-transform" onclick="approveRequest('${request._id}')">
            <i class="fa-solid fa-check"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger border-2 btn-style btn-transform" data-bs-toggle="modal"
  data-bs-target="#rejectModal"   onclick="openRejectModal('${request._id}')">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

    // ✨ اختياري: تنبيه لو البيانات fallback
    if (data.isFallback) {
      console.log("لا توجد طلبات جديدة، يتم عرض آخر الطلبات");
    }

  } catch (err) {
    console.error("حدث خطأ أثناء جلب الطلبات:", err);
  }

}

async function loadLatestDonations(token) {
  try {
    const res = await fetch("http://localhost:5000/api/admin/dashboard/latest-donations", {
  headers: { Authorization: `Bearer ${token}` }
});

    const data = await res.json();

    const tableBody = document.querySelector(".donation-table tbody");
    tableBody.innerHTML = ""; // تفريغ الجدول قبل الإضافة

    data.forEach(donation => {
      const row = `
        <tr>
          <td class="donation-item">
            <div class="donation-icon border rounded-circle d-flex justify-content-center align-items-center">
              <i class="fa-solid fa-dollar-sign"></i>
            </div>

            <div class="donation-details">
              <div class="donation-title">تبرع لحالة #${donation.caseId || "---"}</div>
              <div class="donation-info">
                ${donation.donorInfo?.name|| "مجهول"}  
                ${new Date(donation.donationDate).toLocaleDateString("EG")}
              </div>
            </div>
          </td>

          <td>${donation.originalAmount} ₪</td>
        </tr>
      `;

      tableBody.innerHTML += row;
    });

  } catch (err) {
    console.error("حدث خطأ أثناء تحميل آخر التبرعات:", err);
  }
}

const requestTypeMap = {
  education: "تعليمية",
  health: "صحية",
  living: "معيشية",
  sponsoring: "كفالة",
  emergency: "طوارئ",
  other: "أخرى"
};

const statusMap = {
  pending: 'جديد',
  completed: 'مكتمل',
  approved: 'مقبول',
  rejected: 'مرفوض',
  under_review: 'قيد الراجعة'
};

// عند جلب الطلبات
requests.forEach(req => {
  const arabicType = requestTypeMap[req.requestType];
  console.log(arabicType); // بدل النوع الإنجليزي
});

let  rejectRequestId=null;
function openRejectModal(requestId) {
  rejectRequestId = requestId;
 
}

let  viewDetailsRequestId=null;
async function openviewDetailsModal(requestId) {
  viewDetailsRequestId = requestId;
 try {
    // استدعاء GET request من الباك
    const res = await fetch(`http://localhost:5000/api/admin/requests/${requestId}`);
    const data = await res.json();

    if (!data.success) {
      alert("فشل في جلب تفاصيل الطلب");
      return;
    }

    const request = data.request;

    // 2تعبئة الحقول في المودال
    document.getElementById('detail-orderId').textContent = request._id;
    document.getElementById('detail-type').textContent = `${requestTypeMap[request.requestType] || request.requestType}`;
    document.getElementById('detail-user').textContent = request.firstName + ' ' + request.lastName;
    document.getElementById('detail-idNumber').textContent = request.idNumber;
    document.getElementById('detail-phoneNumber').textContent = request.phoneNumber;
    document.getElementById('detail-email').textContent = request.email;
    document.getElementById('detail-city').textContent = request.city;
   const dynamicFieldsContainer =  document.getElementById('detail-dynamicFields');
    dynamicFieldsContainer.innerHTML = ''; // نظف القديم

for (const [key, value] of Object.entries(request.dynamicFields)) {
  const p = document.createElement('p');
  p.innerHTML = `<strong>${key}:</strong> ${value}`;
  dynamicFieldsContainer.appendChild(p);
}
    document.getElementById('detail-additionalNotes').textContent = request.additionalNotes || '-';
    document.getElementById('detail-urgencyLevel').textContent = translateUrgency(request.urgencyLevel);
    document.getElementById('detail-status').textContent = `${statusMap[request.status]}`;
    document.getElementById('detail-adminNotes').textContent = request.adminNotes || '-';
    document.getElementById('detail-createdAt').textContent = new Date(request.createdAt).toLocaleString();
    document.getElementById('detail-amount').textContent = request.totalDonations || 0;

    // 3تعبئة المستندات
     const docList = document.getElementById("detail-documents");
       docList.innerHTML = "";
       if (request.documents && request.documents.length) {
         request.documents.forEach(doc => {
          const li = document.createElement("li");
           li.className = "list-group-item";
           li.innerHTML = `<a href="${doc.path}" target="_blank">${doc.name}</a>`;
          docList.appendChild(li);
         });
      } else {
         docList.innerHTML = "<li class='list-group-item'>لا توجد مستندات</li>";
      }

    // 4 فتح المودال
    const modalEl = document.getElementById('viewDetailsModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

  } catch (err) {
    console.error(err);
    alert('حدث خطأ أثناء جلب تفاصيل الطلب');
  }
}
function openmarkUnderReview(){
  const modalEl = document.getElementById('underReviewModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}
async function markUnderReview() {
  const notes = document.getElementById('underReviewNotes').value;

  if (!viewDetailsRequestId) {
    alert('لم يتم تحديد الطلب');
    return;
  }

  try {
    const res = await fetch(`http://localhost:5000/api/admin/requests/${viewDetailsRequestId}/underReview`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem("token")|| sessionStorage.getItem('token')}` },
      body: JSON.stringify({}) // ملاحظة افتراضية من الباك
    });

    const data = await res.json();
    alert(data.message);
    location.reload();

   

  } catch (err) {
    console.error(err);
    alert('حدث خطأ');
  }
}


async function approveRequest(requestId) {
  try {
    const res = await fetch(`http://localhost:5000/api/admin/requests/${requestId}/approved`, {
      method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }

    });

    const data = await res.json();
    alert(data.message);
    location.reload();

  } catch (err) {
    console.error(err);
    alert('حدث خطأ');
  }
}


async function submitRejectReason() {
  const reason = document.getElementById('rejectReason').value;

  if (!reason.trim()) {
    alert('يجب إدخال سبب الرفض');
    return;
  }

  try {
    const res = await fetch(`http://localhost:5000/api/admin/requests/${rejectRequestId}/rejected`, {
      method: 'PUT',
       headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")|| sessionStorage.getItem('token')}`
  },
      body: JSON.stringify({ adminNotes: reason })
    });

    const data = await res.json();
    alert(data.message);
    location.reload();

  } catch (err) {
    console.error(err);
    alert('حدث خطأ');
  }
}






