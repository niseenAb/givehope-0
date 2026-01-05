const API = "http://localhost:5000/api/statistics"; // عدّلي حسب مسار الباك

async function loadStatistics() {
  try {
    // إجمالي التبرعات
    const totalDonationsRes = await fetch(`${API}/total-donations`);
    const totalDonations = await totalDonationsRes.json();
    document.getElementById("totalDonations").innerText = totalDonations.total.toLocaleString() + "₪";

    // عدد المتبرعين
    const donorsRes = await fetch(`${API}/donors-count`);
    const donors = await donorsRes.json();
    document.getElementById("donorsCount").innerText = donors.count.toLocaleString();

    // عدد المستفيدين
    const beneficiariesRes = await fetch(`${API}/beneficiaries-count`);
    const beneficiaries = await beneficiariesRes.json();
    document.getElementById("beneficiaries").innerText = beneficiaries.total.toLocaleString();

    // الحملات النشطة
    const activeCampaignsRes = await fetch(`${API}/active-campaigns`);
    const activeCampaigns = await activeCampaignsRes.json();
    document.getElementById("activeCampaigns").innerText = activeCampaigns.count;

    // المشاريع المكتملة
    const completedProjectsRes = await fetch(`${API}/completed-projects`);
    const completedProjects = await completedProjectsRes.json();
    document.querySelectorAll('#beneficiaries')[1].innerText = completedProjects.count;

    // التبرعات الشهرية
    const monthlyDonationsRes = await fetch(`${API}/monthly-donations`);
    const monthlyDonations = await monthlyDonationsRes.json();
    const months = monthlyDonations.map(d => {
      const date = new Date(d.year, d.month - 1);
      return date.toLocaleString('ar', { month: 'long' });
    });
    const donationsData = monthlyDonations.map(d => d.total);
// عدد الحالات المكفولة
const sponsoredCasesRes = await fetch(`${API}/completed-projects`);
const sponsoredCases = await sponsoredCasesRes.json();
document.getElementById("sponsoredCases").innerText = sponsoredCases.count;

// عدد الحملات المكتملة
const completedCampaignsRes = await fetch(`${API}/completed-campaigns-this-year`);
const completedCampaigns = await completedCampaignsRes.json();
document.getElementById("completedCampaigns").innerText = completedCampaigns.completedThisYear;

    // رسم بياني التبرعات
    new Chart(document.getElementById("donationsChart"), {
      type: "line",
      data: {
        labels: months,
        datasets: [{
          label: "قيمة التبرعات",
          data: donationsData,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37,99,235,0.2)",
          fill: true,
          tension: 0.3
        }]
      }
    });

    // المتبرعين الشهريين
    const monthlyDonorsRes = await fetch(`${API}/monthly-donors`);
    const monthlyDonors = await monthlyDonorsRes.json();
    const donorsData = monthlyDonors.map(d => d.count);

    // رسم بياني المتبرعين
    new Chart(document.getElementById("donorsChart"), {
      type: "bar",
      data: {
        labels: months,
        datasets: [{
          label: "عدد المتبرعين",
          data: donorsData,
          backgroundColor: "#3b82f6"
        }]
      }
    });

    // متوسط التبرع الشهر السابق
    const avgDonationRes = await fetch(`${API}/average-donation-last-month`);
    const avgDonation = await avgDonationRes.json();
    document.getElementById("avgDonation").innerText = avgDonation.average.toLocaleString() + " ₪";

    // متبرعون جدد
    const newDonorsRes = await fetch(`${API}/new-donors-this-month`);
    const newDonors = await newDonorsRes.json();
    document.getElementById("newDonors").innerText = newDonors.newDonorsThisMonth;

    // الحملات المكتملة هذا العام
    const completedCampaignsYearRes = await fetch(`${API}/completed-campaigns-this-year`);
    const completedCampaignsYear = await completedCampaignsYearRes.json();
    document.getElementById("completedCampaignsYear").innerText = completedCampaignsYear.completedThisYear;

    // التبرعات حسب الفئات
    const donationCategoriesRes = await fetch(`${API}/donation-categories`);
    const donationCategories = await donationCategoriesRes.json();
    const ctx = document.getElementById('donationChart').getContext('2d');
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: Object.keys(donationCategories.categories),
        datasets: [{
          data: Object.values(donationCategories.categories),
          backgroundColor: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
        }
      }
    });

  } catch (error) {
    console.error("Error loading statistics:", error);
  }
}

// استدعاء الدالة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', loadStatistics);


//   /*  

//  // مثال بيانات حقيقية جايه من API (مؤقتاً ثابتة)
//     const apiData = {
//       totalDonations: 2400000,
//       donorsCount: 12547,
//       activeCampaigns: 45,
//       beneficiaries: 8923,
//       donationsMonthly: [200000, 180000, 220000, 250000, 270000, 300000],
//       donorsMonthly: [500, 700, 900, 1100, 1500, 1800],
//       months: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"]
//     };

//     // تحديث الكروت
//     document.getElementById("totalDonations").innerText = apiData.totalDonations.toLocaleString() + "د.أ";
//     document.getElementById("donorsCount").innerText = apiData.donorsCount.toLocaleString();
//     document.getElementById("activeCampaigns").innerText = apiData.activeCampaigns;
//     document.getElementById("beneficiaries").innerText = apiData.beneficiaries;

//     // رسم بياني التبرعات
//     new Chart(document.getElementById("donationsChart"), {
//       type: "line",
//       data: {
//         labels: apiData.months,
//         datasets: [{
//           label: "قيمة التبرعات",
//           data: apiData.donationsMonthly,
//           borderColor: "#2563eb",
//           backgroundColor: "rgba(37,99,235,0.2)",
//           fill: true,
//           tension: 0.3
//         }]
//       }
//     });

//     // رسم بياني المتبرعين
//     new Chart(document.getElementById("donorsChart"), {
//       type: "bar",
//       data: {
//         labels: apiData.months,
//         datasets: [{
//           label: "عدد المتبرعين",
//           data: apiData.donorsMonthly,
//           backgroundColor: "#3b82f6"
//         }]
//       }
//     });

//      const ctx = document.getElementById('donationChart').getContext('2d');
//     const donationChart = new Chart(ctx, {
//       type: 'pie',
//       data: {
//         labels: ['التعليم', 'الصحة', 'المعيشية', 'الطوارئ', 'رعاية الايتام'],
//         datasets: [{
//           data: [35, 25, 20, 15, 5],
//           backgroundColor: [
//             '#1e40af', // التعليم
//             '#3b82f6', // الصحة
//             '#60a5fa', // المعيشية
//             '#93c5fd', // الطوارئ
//             '#dbeafe'  // رعاية الايتام
//           ],
//           borderColor: '#ffffff',
//           borderWidth: 2
//         }]
//       },
//       options: {
//         responsive: true,
//          maintainAspectRatio: false,
//         plugins: {
//           legend: {
//             position: 'top',
//             labels: {
//               font: { family: 'Cairo', size: 14 },
//               color: '#1e3a8a'
//             }
//           },
//           tooltip: {
//             backgroundColor: '#f8fafc',
//             titleColor: '#1e3a8a',
//             bodyColor: '#2563eb',
//             borderColor: '#3b82f6',
//             borderWidth: 1
//           }
//         }
//       }
//     });
// */