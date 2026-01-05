async function loadHeader() {
    try{
    const res = await fetch("http://localhost:5000/api/admin/me", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")|| sessionStorage.getItem('token')}`,
      },
    });

    const data = await res.json();

   if (!data.success) {
      console.error("Failed to load profile");
      return;
    }

    fillHeader(data.user); // استخدمي مباشرة بيانات المستخدم

  } catch (err) {
    console.error("Error loading header:", err);
  }
}

function fillHeader(user) {
     // تعبئة عناصر الهيدر
    document.getElementById("header-user-name").innerText =
      `${user.firstName} ${user.lastName}`;

    document.getElementById("header-welcome-name").innerText =
      `${user.firstName}`;
      
      document.getElementById("header-profile-pic").src =
      user.profilePic?.url || "./images/profile-icon.jpg";
}

// استدعاء عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", loadHeader);


const notification = document.getElementById("notification");
const pendingList = document.getElementById("pendingList");

notification.addEventListener("click", () => {
    pendingList.classList.toggle("show");
});



const storyCount = document.getElementById("storyCount");



// ---------------------------
// 2️⃣ جلب عدد القصص المعلقة
// ---------------------------
async function loadPendingCount() {
    try {
        const res = await fetch("http://localhost:5000/api/admin/stories/pending/count", {
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")|| sessionStorage.getItem('token')}`,
       },
    } );
        const data = await res.json();

        if (data.count > 0) {
            storyCount.textContent = data.count;
            storyCount.style.display = "inline-block";
        } else {
            storyCount.style.display = "none";
        }

    } catch (err) {
        console.error("حدث خطأ في جلب عدد القصص:", err);
    }
}


// ---------------------------
// 3️⃣ جلب قائمة القصص المعلقة
// ---------------------------
async function loadPendingStories() {
    try {
        pendingList.innerHTML = "<li>جاري التحميل...</li>";

        const res = await fetch("http://localhost:5000/api/admin/stories/pending",{
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")|| sessionStorage.getItem('token')}`,
       },
    } );
        const stories = await res.json();

        pendingList.innerHTML = `<li class="notif-title">طلبات نشر قصة</li>
                            <hr class="notif-divider" />`;

       
        if (stories.length === 0) {
            const li = document.createElement("li");
            li.textContent = "لا توجد إشعارات";
            pendingList.appendChild(li);
            return;
        }

        stories.forEach(story => {
            const li = document.createElement("li");
            li.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">

               <span> <strong>${story.title}</strong> بواسطة: ${story.authorName}</span>
                <div class="action-btns" style=" display:flex; gap:5px;">
                   <i class="fa-solid fa-eye " onclick="openStoryPreview('${story._id}')" title="معاينة"></i>
        <i class="fa-solid fa-check" onclick="approveStory('${story._id}')"  title="قبول"></i>
        <i class="fa-solid fa-xmark" onclick="rejectStory('${story._id}')" title="رفض"></i>
            </div>
                </div>
            `;
            pendingList.appendChild(li);
        });

    } catch (err) {
        console.error("حدث خطأ في جلب القصص:", err);
        pendingList.innerHTML = "<li>حدث خطأ في تحميل الإشعارات</li>";
    }
}


// ---------------------------
// 4️⃣ معاينة القصة
// ---------------------------
// function viewStory(id) {
//     window.location.href = http://localhost:5000/api/admin/admin//stories/${id};
// }

// async function openStoryPreview(id) {
//     try {
//         const res = await fetch(`http://localhost:5000/api/admin/stories/${id}`);
//         const story = await res.json();

//         document.getElementById("previewTitle").innerText = story.title;
//         document.getElementById("previewType").innerText = story.type;
//         document.getElementById("previewCategory").innerText = story.category;
//         document.getElementById("previewTime").innerText = story.time || "غير متوفر";
//         document.getElementById("previewContent").innerText = story.content;

//         document.getElementById("previewAuthor").innerText = story.authorName;
//         document.getElementById("previewCreatedAt").innerText = new Date(story.createdAt).toLocaleString();

//         document.getElementById("previewDonations").innerText = story.donations + " " + story.currency;
//         document.getElementById("previewCurrency").innerText = story.currency;
//         document.getElementById("previewViews").innerText = story.views;

//         if (story.image) {
//             document.getElementById("previewImage").src = story.image;
//             document.getElementById("previewImage").style.display = "block";
//         } else {
//             document.getElementById("previewImage").style.display = "none";
//         }

//         document.getElementById("storyPreviewModal").style.display = "block";

//     } catch (err) {
//         console.error("خطأ في جلب القصة:", err);
//     }
// }

// document.getElementById("closePreviewModal").onclick = function () {
//     document.getElementById("storyPreviewModal").style.display = "none";
// };


async function openStoryPreview(id) {
    try {
        const res = await fetch(`http://localhost:5000/api/admin/stories/${id}`,{
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")|| sessionStorage.getItem('token')}`,
       },
    } );
        const story = await res.json();
console.log("STORY ===>", story);

        // تعبئة البيانات
        document.getElementById("previewTitle").innerText = story.title;
        document.getElementById("previewType").innerText = story.type;
        document.getElementById("previewCategory").innerText = story.category;
        document.getElementById("previewTime").innerText = story.time || "غير متوفر";
        document.getElementById("previewContent").innerText = story.content;

        document.getElementById("previewAuthor").innerText = story.authorName;
        document.getElementById("previewCreatedAt").innerText = new Date(story.createdAt).toLocaleString();

        document.getElementById("previewDonations").innerText = story.donations + " " + story.currency;
        document.getElementById("previewCurrency").innerText = story.currency;
        document.getElementById("previewViews").innerText = story.views;

        // صورة
        if (story.image) {
            document.getElementById("previewImage").src = story.image;
            document.getElementById("previewImage").style.display = "block";
        } else {
            document.getElementById("previewImage").style.display = "none";
        }

        // فتح المودال
        document.getElementById("storyPreviewModal").style.display = "block";

    } catch (err) {
        console.error("خطأ في جلب القصة:", err);
    }
}
document.getElementById("closePreviewModal").onclick = function () {
    document.getElementById("storyPreviewModal").style.display = "none";
};

window.onclick = function (e) {
    if (e.target === document.getElementById("storyPreviewModal")) {
        document.getElementById("storyPreviewModal").style.display = "none";
    }
};

// ---------------------------
// 5️⃣ قبول القصة
// ---------------------------
async function approveStory(id) {
    try {
        const res = await fetch(`http://localhost:5000/api/admin/stories/${id}/approve`, { 
            method: "PUT" ,
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")|| sessionStorage.getItem('token')}`,
       },
    } );
   

        if (res.ok) {
            await loadPendingStories();
            await loadPendingCount();
        } else {
            console.error("حدث خطأ أثناء قبول القصة");
        }

    } catch (err) {
        console.error(err);
    }
}


// ---------------------------
// 6️⃣ رفض القصة
// ---------------------------
async function rejectStory(id) {
    try {
        const res = await fetch(`http://localhost:5000/api/admin/stories/${id}/reject`, { 
            method: "PUT",
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")|| sessionStorage.getItem('token')}`,
       },
    } ); 
       

        if (res.ok) {
            await loadPendingStories();
            await loadPendingCount();
        } else {
            console.error("حدث خطأ أثناء رفض القصة");
        }

    } catch (err) {
        console.error(err);
    }
}


// ---------------------------
// 7️⃣ تحميل البيانات عند بدء الصفحة
// ---------------------------
loadPendingCount();
loadPendingStories();