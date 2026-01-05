

async function fetchAdminProfile() {
  try {
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

    const user = data.user;

    // تعبئة الحقول
    document.getElementById("firstName").value = user.firstName || "";
    document.getElementById("lastName").value = user.lastName || "";
    document.getElementById("email").value = user.email || "";
    document.getElementById("phone").value = user.phone || "";

    // تعبئة عناصر الهيدر
    document.getElementById("header-user-name").innerText =
      `${user.firstName} ${user.lastName}`;

    document.getElementById("header-welcome-name").innerText =
      `${user.firstName}`;
      
    // تعبئة الصورة
    document.getElementById("profile-pic").src =
      user.profilePic?.url || "./images/profile-icon.jpg";

      document.getElementById("header-profile-pic").src =
      user.profilePic?.url || "./images/profile-icon.jpg";

  } catch (err) {
    console.error("Error loading admin data", err);
  }
}

// شغّلي الدالة عند فتح الصفحة
fetchAdminProfile();






// =====================
// المتغيرات
// =====================
const firstNameInput = document.getElementById("firstName");
const lastNameInput = document.getElementById("lastName");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const oldPasswordInput = document.getElementById("oldPassword");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const saveBtn = document.querySelector("button[onclick='saveSettings()']");

// =====================
// 1️⃣ تغيير الصورة عند الضغط على زر التغيير
// =====================
document.getElementById("chang-pic").addEventListener("click", () => {
  document.getElementById("upload-pic").click();
});

document.getElementById("upload-pic").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      document.getElementById("profile-pic").src = reader.result;
    };
    reader.readAsDataURL(file);
  }
});

// =====================
// 2️⃣ حذف الصورة مباشرة
// =====================
async function deleteImg() {
  const result = await Swal.fire({
    title: "هل أنت متأكد؟",
    text: "لن يمكنك التراجع بعد حذف الصورة",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "نعم، احذف",
    cancelButtonText: "إلغاء"
  });

  if (!result.isConfirmed) return;

  document.getElementById("profile-pic").src = "./images/profile-icon.jpg";
  document.getElementById("upload-pic").value = "";
  window.removeProfilePic = true;

  // إرسال الفورم فورياً للباك

  const formData = new FormData();
  formData.append("removeProfilePic", true);
  

  try {
    const res = await fetch("http://localhost:5000/api/admin/settings", {
      method: "PUT",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")|| sessionStorage.getItem('token')}` },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "فشل حذف الصورة");
    Swal.fire("تم", "تم حذف الصورة بنجاح", "success");
    window.removeProfilePic = false;
  } catch (err) {
    console.error(err);
    Swal.fire("خطأ", err.message || "فشل حذف الصورة", "error");
  }
}

// =====================
// 3️⃣ مؤشر قوة كلمة المرور
// =====================
function updatePasswordStrength(password) {
  removePasswordStrengthIndicator();
  if (!password) return;

  let score = 0;
  let requirements = [];

  if (password.length >= 8) score++; else requirements.push('على الأقل 8 أحرف');
  if (/[a-z]/.test(password)) score++; else requirements.push('حرف صغير');
  if (/[A-Z]/.test(password)) score++; else requirements.push('حرف كبير');
  if (/\d/.test(password)) score++; else requirements.push('رقم');
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++; else requirements.push('رمز خاص');

  let strengthText = '', textColor = '';
  if (score < 3) { strengthText = 'ضعيفة'; textColor = 'danger'; }
  else if (score < 5) { strengthText = 'متوسطة'; textColor = 'warning'; }
  else { strengthText = 'قوية'; textColor = 'success'; }

  const indicator = document.createElement('div');
  indicator.id = 'passwordStrengthIndicator';
  indicator.className = `form-text text-${textColor}`;
  indicator.textContent = `قوة كلمة المرور: ${strengthText}. ${requirements.length > 0 ? 'مفقود: ' + requirements.join('، ') : ''}`;
  newPasswordInput.parentElement.appendChild(indicator);
}

function removePasswordStrengthIndicator() {
  const existing = document.getElementById('passwordStrengthIndicator');
  if (existing) existing.remove();
}

function validatePasswordMatch() {
  if (!confirmPasswordInput.value) {
    confirmPasswordInput.classList.remove('is-valid', 'is-invalid');
    return;
  }
  if (newPasswordInput.value === confirmPasswordInput.value) {
    confirmPasswordInput.classList.add('is-valid');
    confirmPasswordInput.classList.remove('is-invalid');
  } else {
    confirmPasswordInput.classList.add('is-invalid');
    confirmPasswordInput.classList.remove('is-valid');
  }
}

newPasswordInput.addEventListener('input', function() {
  updatePasswordStrength(this.value);
  validatePasswordMatch();
});

confirmPasswordInput.addEventListener('input', validatePasswordMatch);

// =====================
// 4️⃣ تحقق من البريد
// =====================
const emailStatus = document.getElementById('emailStatus');
let emailTimer;
emailInput.addEventListener('input', () => {
  clearTimeout(emailTimer);
  const email = emailInput.value.trim();
  emailStatus.textContent = "";
  emailStatus.className = "form-text";
  if (!email) return;

  emailTimer = setTimeout(async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      emailStatus.textContent = "صيغة البريد غير صحيحة";
      emailStatus.className = "form-text text-danger";
      return;
    }
   
    try {
      const res = await fetch(`http://localhost:5000/api/admin/settings/check-email?email=${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")|| sessionStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.exists) {
        emailStatus.textContent = "البريد الإلكتروني مستخدم مسبقًا ❌";
        emailStatus.className = "form-text text-danger";
      } else {
        emailStatus.textContent = "البريد الإلكتروني متاح ✔️";
        emailStatus.className = "form-text text-success";
      }
    } catch {
      emailStatus.textContent = "خطأ في التحقق من البريد";
      emailStatus.className = "form-text text-danger";
    }
  }, 500);
});

// =====================
// 5️⃣ حفظ الإعدادات
// =====================
async function saveSettings() {
  const firstName = firstNameInput.value.trim();
  const lastName = lastNameInput.value.trim();
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();
  const oldPassword = oldPasswordInput.value;
  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  const profilePicFile = document.getElementById("upload-pic").files[0];

  if (!firstName || !lastName) { Swal.fire("خطأ", "الاسم الأول واسم العائلة مطلوبان", "warning"); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { Swal.fire("خطأ", "صيغة البريد غير صحيحة", "warning"); return; }
  if (newPassword) {
    if (!oldPassword) { Swal.fire("خطأ", "يجب إدخال كلمة المرور الحالية", "warning"); return; }
    if (newPassword !== confirmPassword) { Swal.fire("خطأ", "كلمة المرور الجديدة وتأكيدها غير متطابقين", "warning"); return; }
  }

  
  const formData = new FormData();
  formData.append("firstName", firstName);
  formData.append("lastName", lastName);
  formData.append("email", email);
  formData.append("phone", phone);
  formData.append("oldPassword", oldPassword);
  formData.append("newPassword", newPassword);

  if (profilePicFile) formData.append("profilePic", profilePicFile);
  if (window.removeProfilePic) formData.append("removeProfilePic", true);

  try {
    const res = await fetch("http://localhost:5000/api/admin/settings", {
      method: "PUT",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")|| sessionStorage.getItem('token')}` },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "فشل حفظ البيانات");
    Swal.fire("تم", "تم تحديث بياناتك بنجاح", "success");
    window.removeProfilePic = false;
  } catch (err) {
    console.error(err);
    Swal.fire("خطأ", err.message, "error");
  }
}

// =====================
// 6️⃣ ربط زر الحفظ
// =====================
saveBtn.addEventListener("click", saveSettings);

// =====================
// 7️⃣ تحميل البيانات عند فتح الصفحة
// =====================
document.addEventListener("DOMContentLoaded", loadAdminProfile);
