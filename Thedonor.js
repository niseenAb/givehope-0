document.addEventListener('DOMContentLoaded', function () {
    // ---------------------------------------------------------------------
    // 1. البيانات الديناميكية (Dynamic Data)
    // ---------------------------------------------------------------------
    let userData = {
        name: "محمد أحمد",
        email: "mohamed@example.com",
        wallet: 1250,
        joinYear: 2022,
        totalDonated: 5750,
        goal: 10000,
        helpedCases: 12,
        completedCases: 8,
        monthlyAvg: 480
    };

    // API Configuration
    const API_BASE_URL = 'http://localhost:5000/api';

    // ---------------------------------------------------------------------
    // Fetch User Data from Backend
    // ---------------------------------------------------------------------
    async function fetchUserData() {
        try {
            // Get token from localStorage or sessionStorage
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');

            if (!token) {
                console.warn('No authentication token found. Redirecting to login...');
                window.location.href = 'login.html';
                return null;
            }

            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.warn('Unauthorized. Token may be expired. Redirecting to login...');
                    localStorage.removeItem('token');
                    sessionStorage.removeItem('token');
                    localStorage.removeItem('user');
                    sessionStorage.removeItem('user');
                    window.location.href = 'login.html';
                    return null;
                }
                throw new Error('Failed to fetch user data');
            }

            const data = await response.json();

            if (data.success && data.user) {
                // Update userData with backend data
                userData.name = `${data.user.firstName} ${data.user.lastName}`;
                userData.email = data.user.email;
                userData.firstName = data.user.firstName;
                userData.lastName = data.user.lastName;
                userData.id = data.user._id || data.user.id;
                userData.role = data.user.role;
                userData.phone = data.user.phone || '';
                userData.donationGoal = data.user.donationGoal;

                // Update donation statistics from profile API
                if (data.user.totalDonationAmount !== undefined) {
                    userData.totalDonated = data.user.totalDonationAmount;
                }
                if (data.user.totalDonationRequests !== undefined) {
                    userData.helpedCases = data.user.totalDonationRequests;
                }

                // Set created date (use current date if not available from profile API)
                userData.createdAt = data.user.createdAt || new Date().toISOString();

                // Update user info displays
                updateUserInfoDisplays();

                return data.user;
            }

            return null;
        } catch (error) {
            console.error('Error fetching user data:', error);
            Swal.fire({
                title: 'خطأ',
                text: 'حدث خطأ في تحميل بيانات المستخدم',
                icon: 'error',
                confirmButtonText: 'حسناً'
            });
            return null;
        }
    }

    // ---------------------------------------------------------------------
    // Update User Info Displays
    // ---------------------------------------------------------------------
    function updateUserInfoDisplays() {
        // Update header user info
        const headerUserName = document.querySelector('.user-info > div > div:first-child');
        if (headerUserName) {
            headerUserName.textContent = `أهلاً بك، ${userData.firstName || userData.name}`;
        }

        const joinYear = document.getElementById("join-year");
        if (joinYear) {
            joinYear.innerHTML = new Date(userData.createdAt).getFullYear();
        }

        // Update profile sections
        const profileName = document.querySelectorAll('.profile-info h3');
        profileName.forEach(el => {
            el.textContent = userData.name;
        });

        const profileEmail = document.querySelectorAll('.profile-info p');
        profileEmail.forEach(el => {
            el.textContent = userData.email;
        });

        // Update avatar initials
        const initial = userData.firstName ? userData.firstName.charAt(0) : 'م';
        const avatars = document.querySelectorAll('.user-avatar, .profile-avatar');
        avatars.forEach(el => {
            el.textContent = initial;
        });

        // Update form fields in profile tab
        const firstNameInput = document.getElementById('firstName');
        if (firstNameInput) {
            firstNameInput.value = userData.firstName || '';
        }

        const lastNameInput = document.getElementById('lastName');
        if (lastNameInput) {
            lastNameInput.value = userData.lastName || '';
        }

        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.value = userData.email;
        }

        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.value = userData.phone || '';
        }

        const statTotalDonationRequests = document.getElementById("stat-total-donation-requests")
        if (statTotalDonationRequests) {
            statTotalDonationRequests.innerHTML = `${userData.helpedCases} حالة`;
        }

        const donationsGoal = document.getElementById("stat-donations-goal")
        if (donationsGoal) {
            donationsGoal.innerHTML = userData.donationGoal
        }
    }

    // Donations will be fetched from API
    let donations = [];

    // ---------------------------------------------------------------------
    // Fetch Donation Payments from Backend
    // ---------------------------------------------------------------------
    async function fetchDonationPayments() {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');

            if (!token) {
                console.warn('No authentication token found');
                return;
            }

            // Fetch payments by donatee (current user)
            if (!userData.id) {
                console.warn('User ID not available');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/donation-payments/donatee/${userData.id}?limit=100`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch donation payments');
            }

            const data = await response.json();

            if (data.success && data.donationPayments) {
                // Transform API data to match the format expected by display functions
                donations = data.donationPayments.map(payment => {
                    // Map payment status to display status
                    let status = 'pending';
                    if (payment.status === 'completed') {
                        status = 'delivered';
                    } else if (payment.status === 'failed' || payment.status === 'refunded') {
                        status = 'pending';
                    }

                    // Get category from donation request if available
                    let category = 'other';
                    if (payment.donationRequest && payment.donationRequest.requestType) {
                        category = payment.donationRequest.requestType;
                    }

                    // Format title
                    let title = 'تبرع';
                    if (payment.donationRequest) {
                        const reqType = payment.donationRequest.requestType || 'other';
                        const reqId = payment.donationRequest._id || payment.donationRequest.id;
                        title = `حالة ${reqType} - رقم ${reqId.substring(reqId.length - 6)}`;
                    }

                    // Format date
                    const paymentDate = new Date(payment.donationDate);
                    const formattedDate = paymentDate.toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });

                    return {
                        id: payment._id || payment.id,
                        title: title,
                        date: formattedDate,
                        amount: payment.donationAmount,
                        category: category,
                        status: status
                    };
                });

                // Calculate total donated amount
                const totalDonated = donations
                    .filter(d => d.status === 'delivered')
                    .reduce((sum, d) => sum + d.amount, 0);

                userData.totalDonated = totalDonated;
                userData.helpedCases = donations.length;

                // Update displays
                updateStatCards();
                displayDonations();
                displayLatestDonations();
            }
        } catch (error) {
            console.error('Error fetching donation payments:', error);
        }
    }

    const activeCampaigns = [
        { id: 50, title: "كسوة الشتاء", progress: 70, target: 10000, current: 7000, category: "campaigns", image: "images/winter-clothes.jpg", deadline: "30 نوفمبر 2025" },
        { id: 60, title: "الإفطار الرمضاني", progress: 40, target: 10000, current: 4000, category: "campaigns", image: "images/ramadan-iftar.jpg", deadline: "20 مارس 2026" }
    ];

    const activeCases = [
        { title: "كسوة الشتاء للعائلات النازحة", description: "توفير ملابس شتوية دافئة لـ 50 عائلة نازحة في مناطق جبلية.", progress: 70, status: "pending", target: 50, current: 35 },
        { title: "الإفطار الرمضاني للأيتام", description: "توفير وجبات إفطار يومية لـ 100 طفل يتيم خلال شهر رمضان.", progress: 40, status: "pending", target: 100, current: 40 },
        { title: "منح تعليمية للطلاب المحتاجين", description: "تمويل دراسة 5 طلاب محتاجين لمدة عام دراسي كامل.", progress: 100, status: "received", target: 5, current: 5 }
    ];

    const successStories = [
        {
            id: 1, title: "قصه ليلى", type: "مستفيد", category: "مشاريع خيرية", time: "", image: "images/food.jpg",
            content: `<p>أنا ليلى، أم لأربعة أطفال، وكنا نعيش ظروف صعبة جدًا بعد فقدان زوجي لوظيفته. لم يكن لدينا القدرة على توفير الاحتياجات الأساسية اليومية، وكنت أخشى على مستقبل أولادي.</p>
                <p>سجلنا في مشروع دعم الأسر المحتاجة، وبفضل التبرعات والدعم الذي وصلنا، تمكنا من الحصول على سلال غذائية وأدوات مدرسية للأطفال، بالإضافة إلى دعم بسيط لتغطية الاحتياجات المنزلية.</p>
                <p>هذا المشروع لم يوفر لنا المواد فقط، بل أعاد لنا الأمل ورفع معنوياتنا. أشعر الآن بالطمأنينة لأن أولادي قادرون على متابعة دراستهم وأحسست أننا لسنا وحدنا.</p>
                <p>تجربتي أثبتت لي أن الدعم في الوقت المناسب قادر على تغيير حياة أسرة كاملة ومنحنا فرصة لمستقبل أفضل.</p>`
        },
        {
            id: 2, title: "قصه محمد", category: "صحيه", type: "مستفيد", time: "", image: "images/heartt.PNG",
            content: `<p>كنت أعاني من مرض بالقلب وكان لا بد من إجراء عملية جراحية عاجلة. الأطباء أخبروا عائلتي أن أي تأخير قد يشكل خطرًا على حياتي، لكن تكلفة العملية كانت أكبر من قدرة أسرتي المادية.</p>
<p>بعد محاولات كثيرة، تواصلت عائلتي مع منظمة GiveHope، وبفضل التبرعات التي وصلتنا تمكنا من جمع المبلغ المطلوب بسرعة، وتمت العملية في مستشفى متخصص بنجاح.</p>
<p>تقول والدتي: "لم نكن نعرف كيف سننقذ حياة محمد، لكن دعم الناس أعطانا أملًا جديدًا."</p>
<p>الآن أنا أتعافى بشكل جيد وأتابع جلسات المراجعة الطبية بانتظام. أحلم أن أصبح مهندسًا في المستقبل حتى أستطيع أن أقدم شيئًا لمجتمعي كما قدموا لي. عائلتي لا تزال تتذكر دعمكم في أصعب الأوقات.</p>
<p>هذه التجربة أثبتت لنا أن الدعم في الوقت المناسب قادر فعلاً على إنقاذ حياة وتغيير مستقبل عائلة بأكملها.</p>`
        }
    ];

    // كفالات المستخدم النشطة (User's Active Sponsorships)
    const userActiveSponsorships = [
        {
            id: 1,
            title: "كفالة يتيم - أحمد محمد",
            amount: 300,
            paymentPeriod: "monthly",
            nextPaymentDate: "2025-01-15",
            status: "active"
        },
        {
            id: 2,
            title: "كفالة أسرة - عائلة محمود",
            amount: 500,
            paymentPeriod: "monthly",
            nextPaymentDate: "2025-01-20",
            status: "active"
        },
        {
            id: 3,
            title: "كفالة طالب علم - سارة",
            amount: 1500,
            paymentPeriod: "semester",
            nextPaymentDate: "2025-02-01",
            status: "active"
        }
    ];

    // بيانات طلبات الكفالة (Sponsor Requests Data) - كفالة دورية لفترة محددة
    const sponsorRequests = [
        {
            id: 1,
            title: "كفالة يتيم - أحمد محمد",
            date: "20 يناير 2024",
            amount: 300,
            paymentPeriod: "monthly", // monthly, semester, yearly
            duration: 12,
            completedPeriods: 7,
            category: "sponsoring",
            status: "active",
            description: "كفالة شهرية ليتيم عمره 8 سنوات لمدة عام"
        },
        {
            id: 2,
            title: "كفالة أسرة - عائلة محمود",
            date: "10 يناير 2024",
            amount: 500,
            paymentPeriod: "monthly",
            duration: 6,
            completedPeriods: 3,
            category: "sponsoring",
            status: "active",
            description: "كفالة شهرية لأسرة مكونة من 5 أفراد"
        },
        {
            id: 3,
            title: "كفالة طالب علم - سارة",
            date: "15 ديسمبر 2023",
            amount: 1500,
            paymentPeriod: "semester",
            duration: 4,
            completedPeriods: 4,
            category: "education",
            status: "completed",
            description: "كفالة فصلية لطالبة جامعية لمدة سنتين دراسيتين (4 فصول)"
        },
        {
            id: 4,
            title: "كفالة مريض - عائلة خالد",
            date: "12 يناير 2024",
            amount: 400,
            paymentPeriod: "monthly",
            duration: 12,
            completedPeriods: 2,
            category: "health",
            status: "active",
            description: "كفالة شهرية لعلاج مريض مزمن"
        },
        {
            id: 5,
            title: "كفالة أسرة - عائلة أحمد",
            date: "5 نوفمبر 2023",
            amount: 7200,
            paymentPeriod: "yearly",
            duration: 2,
            completedPeriods: 2,
            category: "sponsoring",
            status: "completed",
            description: "كفالة سنوية لأسرة نازحة لمدة سنتين"
        },
        {
            id: 6,
            title: "كفالة يتيم - فاطمة",
            date: "8 يناير 2024",
            amount: 200,
            paymentPeriod: "monthly",
            duration: 24,
            completedPeriods: 1,
            category: "sponsoring",
            status: "active",
            description: "كفالة شهرية ليتيمة عمرها 10 سنوات لمدة سنتين"
        },
        {
            id: 7,
            title: "كفالة طالب علم - يوسف",
            date: "5 أكتوبر 2023",
            amount: 1200,
            paymentPeriod: "semester",
            duration: 6,
            completedPeriods: 6,
            category: "education",
            status: "completed",
            description: "كفالة فصلية لطالب جامعي لمدة 3 سنوات دراسية (6 فصول)"
        },
        {
            id: 8,
            title: "كفالة علاج مزمن - مريضة سكري",
            date: "3 يناير 2024",
            amount: 4200,
            paymentPeriod: "yearly",
            duration: 3,
            completedPeriods: 1,
            category: "health",
            status: "active",
            description: "كفالة سنوية لتوفير أدوية ومستلزمات مريضة سكري لمدة 3 سنوات"
        }
    ];

    // دالة للحصول على نص الفترة بالعربية
    function getPeriodText(paymentPeriod, isPlural = false) {
        const periods = {
            monthly: { singular: 'شهر', plural: 'أشهر', adjective: 'شهري', adjectiveFeminine: 'شهرية' },
            semester: { singular: 'فصل', plural: 'فصول', adjective: 'فصلي', adjectiveFeminine: 'فصلية' },
            yearly: { singular: 'سنة', plural: 'سنوات', adjective: 'سنوي', adjectiveFeminine: 'سنوية' }
        };
        return periods[paymentPeriod] || periods.monthly;
    }

    // ---------------------------------------------------------------------
    // 2. تحديث بطاقات الإحصائيات (Goal Update & Stats Cards) 🎯
    // ---------------------------------------------------------------------
    function updateStatCards() {
        const totalDonated = parseFloat(userData.totalDonationAmount ?? 0);
        const personalGoal = parseFloat(userData.donationGoal ?? 0)

        // حساب النسبة المئوية
        let percentAchieved = !personalGoal ? 0 : (totalDonated / personalGoal) * 100;
        // تقريب النسبة الآمنة (لا تزيد عن 100%)
        const safePercent = Math.round(percentAchieved > 100 ? 100 : percentAchieved);

        // تهيئة القيمة للعملة
        const currency = ' د.ا';
        const formattedTotal = totalDonated.toLocaleString() + currency;
        const formattedGoal = personalGoal.toLocaleString() + currency;


        // === تحديث بطاقة "رصيدي الكامل من الخير" ===
        const amountElement = document.querySelectorAll('.donation-amount');
        const goalTextElement = document.querySelector('.goal-display-text');
        const progressBarFill = document.querySelector('.progress-fill');
        const statGoal = document.querySelector("#stat-goal");
        const statGoalPercentage = document.querySelector("#stat-goal-percentage");
        if (amountElement) {
            amountElement.forEach(item => {
                item.innerHTML = formattedTotal;
            })
        }

        if (statGoal) {
            statGoal.innerHTML = formattedGoal;
        }

        if (statGoalPercentage) {
            statGoalPercentage.innerHTML = `${safePercent}% من هدفك`
        }

        if (goalTextElement) {
            goalTextElement.textContent = `${safePercent}% من هدفك البالغ ${formattedGoal}`;
        }

        if (progressBarFill) {
            progressBarFill.style.width = `${safePercent}%`;
            // لإزالة أي كلاسات ثابتة سابقة مثل progress-70
            progressBarFill.className = 'progress-fill';

            // تلوين شريط التقدم بناءً على الإنجاز
            if (safePercent >= 100) {
                progressBarFill.style.backgroundColor = 'var(--success, #28a745)';
            } else if (safePercent >= 50) {
                progressBarFill.style.backgroundColor = 'var(--warning, #ffc107)';
            } else {
                progressBarFill.style.backgroundColor = 'var(--primary, #007bff)';
            }
        }


        // === تحديث بطاقة "هدفك الشخصي" ===
        const statCardElement = document.querySelector('.stat-card');

        if (statCardElement) {
            const valueElement = statCardElement.querySelector('.stat-value-goal');

            const percentElement = statCardElement.querySelector('div:last-child');

            if (valueElement) {
                valueElement.innerHTML = formattedGoal;
            }

            if (percentElement && percentElement.textContent.includes('هدف')) {
                percentElement.textContent = `${safePercent}% من هدفك`;
            }
        }
    }


    // === ربط تحديث الهدف بالدالة ===
    const updateGoalButton = document.getElementById('updateGoal');
    if (updateGoalButton) {
        updateGoalButton.addEventListener('click', async function () {
            const result = await Swal.fire({
                title: 'تحديث الهدف',
                input: 'number',
                inputLabel: 'الهدف الجديد (د.ا)',
                inputValue: userData.donationGoal,
                showCancelButton: true,
                confirmButtonText: 'حفظ',
                cancelButtonText: 'إلغاء',
                inputValidator: (value) => {
                    if (!value || isNaN(value) || Number(value) <= 0) {
                        return 'الرجاء إدخال هدف صحيح وموجب';
                    }
                }
            });

            if (result.isConfirmed) {
                const newGoal = parseInt(result.value);
                
                try {
                    // Get token
                    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                    
                    if (!token) {
                        Swal.fire({
                            title: 'خطأ',
                            text: 'يجب تسجيل الدخول أولاً',
                            icon: 'error',
                            confirmButtonText: 'حسناً'
                        });
                        return;
                    }

                    // Show loading
                    Swal.fire({
                        title: 'جاري تحديث الهدف...',
                        text: 'يرجى الانتظار',
                        icon: 'info',
                        showConfirmButton: false,
                        allowOutsideClick: false
                    });

                    // Make API call
                    const response = await fetch(`${API_BASE_URL}/users/goal`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            goal: newGoal
                        })
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        // Update local userData
                        userData.donationGoal = data.goal;
                        
                        // Update the UI
                        updateStatCards();
                        
                        Swal.fire({
                            title: 'تم!',
                            text: 'تم تحديث الهدف بنجاح',
                            icon: 'success',
                            confirmButtonText: 'حسناً'
                        });
                    } else {
                        Swal.fire({
                            title: 'خطأ',
                            text: data.message || 'حدث خطأ أثناء تحديث الهدف',
                            icon: 'error',
                            confirmButtonText: 'حسناً'
                        });
                    }
                } catch (error) {
                    console.error('Error updating goal:', error);
                    Swal.fire({
                        title: 'خطأ',
                        text: 'حدث خطأ في الاتصال بالخادم',
                        icon: 'error',
                        confirmButtonText: 'حسناً'
                    });
                }
            }
        });
    }

    // ---------------------------------------------------------------------
    // 3. وظائف التنقل (Tab Navigation)
    // ---------------------------------------------------------------------
    const navLinks = document.querySelectorAll('.nav-links li');
    const tabContents = document.querySelectorAll('.tab-content');

    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            const section = this.getAttribute('data-section');

            // تحديث التنقل النشط
            navLinks.forEach(item => item.classList.remove('active'));
            this.classList.add('active');

            // إظهار المحتوى المناسب
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === section) {
                    content.classList.add('active');
                }
            });
        });
    });

    // ---------------------------------------------------------------------
    // 4. وظائف العرض (Display Functions)
    // ---------------------------------------------------------------------

    // عرض الحملات النشطة
    function displayActiveCampaigns() {
        const container = document.getElementById('activeCampaigns');
        if (!container) return;

        container.innerHTML = '';
        const currency = ' د.أ';

        activeCampaigns.forEach(campaign => {
            const campaignCard = document.createElement('div');
            campaignCard.className = 'campaign-card';

            const remaining = campaign.target - campaign.current;
            const percent = campaign.progress || Math.round((campaign.current / campaign.target) * 100);
            const urgent = (remaining / campaign.target) < 0.3 && remaining > 0;

            campaignCard.innerHTML = `
                ${urgent ? '<span class="urgent-label">عاجل</span>' : ""}
                <div class="case-content">
                    <h3>${campaign.title}</h3>
                    <p>المبلغ المطلوب: ${campaign.target.toLocaleString()}${currency}</p>
                    <p>المبلغ المتبقي: <span class="remaining">${remaining.toLocaleString()}</span>${currency}</p>
                    <div class="progress-container">
                        <div class="progress-bar" style="width:${percent > 100 ? 100 : percent}%;"></div>
                    </div>
                    <p>نسبة الإنجاز: <span class="percentage">${percent > 100 ? 100 : percent}%</span></p>
                    <p class="deadline">الموعد النهائي: ${campaign.deadline || 'غير محدد'}</p>
                    <div class="case-actions">
                        <button class="btn-donate" onclick="window.location.href='DonateNow.html?id=${campaign.id}'">
                            <i class="fas fa-hand-holding-heart"></i> تبرع الآن
                        </button>
                        <button class="btn-details" onclick="window.location.href='campaign-details.html?id=${campaign.id}'">
                            <i class="fas fa-eye"></i> التفاصيل
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(campaignCard);
        });
    }

    // عرض التبرعات في سجل التبرعات
    function displayDonations(filterCategory = 'all', filterStatus = 'all') {
        const donationsList = document.getElementById('donationsList');
        if (!donationsList) return;

        donationsList.innerHTML = '';
        const currency = ' د.ا';

        const filteredDonations = donations.filter(donation => {
            const categoryMatch = filterCategory === 'all' || donation.category === filterCategory;
            const statusMatch = filterStatus === 'all' || donation.status === filterStatus;
            return categoryMatch && statusMatch;
        });

        if (filteredDonations.length === 0) {
            donationsList.innerHTML = '<li class="no-donations">لا توجد تبرعات مطابقة لمرشحات البحث.</li>';
            return;
        }

        filteredDonations.forEach(donation => {
            const donationItem = document.createElement('li');
            donationItem.className = 'donation-item';
            donationItem.setAttribute('data-category', donation.category);
            donationItem.setAttribute('data-status', donation.status);

            const statusClass = donation.status === 'delivered' ? 'status-delivered' : 'status-pending';
            const statusText = donation.status === 'delivered' ? 'تم التوصيل' : 'قيد التوصيل';
            const amountFormatted = donation.amount.toLocaleString();

            donationItem.innerHTML = `
                <div>
                    <div>${donation.title.trim()}</div>
                    <div class="donation-date">${donation.date.trim()}</div>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="donation-value">${amountFormatted}${currency}</div>
                    <div class="donation-receipt">تحميل الإيصال</div>
                </div>
            `;

            // إضافة معالج حدث لتحميل الإيصال
            donationItem.querySelector('.donation-receipt').addEventListener('click', () => {
                Swal.fire({
                    title: 'تحميل الإيصال',
                    text: `سيتم تحميل إيصال التبرع لـ "${donation.title.trim()}" بصيغة PDF`,
                    icon: 'info',
                    confirmButtonText: 'موافق'
                });
            });

            donationsList.appendChild(donationItem);
        });
    }

    // عرض آخر 3 تبرعات
    function displayLatestDonations() {
        const container = document.getElementById('latestDonationsList');
        if (!container) return;

        // فرز التبرعات حسب ID تنازليًا (افتراضًا أن ID الأكبر هو الأحدث)
        const sortedDonations = [...donations].sort((a, b) => b.id - a.id);
        const latestThree = sortedDonations.slice(0, 3);
        const currency = ' د.ا';

        container.innerHTML = '';

        latestThree.forEach(donation => {
            const donationItem = document.createElement('li');
            donationItem.className = 'donation-item';

            donationItem.innerHTML = `
                <div>
                    <div>${donation.title.trim()}</div>
                    <div class="donation-date">${donation.date.trim()}</div>
                </div>
                <div class="donation-value">${donation.amount.toLocaleString()}${currency}</div>
            `;

            container.appendChild(donationItem);
        });
    }

    // ---------------------------------------------------------------------
    // 5. وظائف قصص النجاح (Success Stories)
    // ---------------------------------------------------------------------
    function getExcerpt(content) {
        // تستخرج الفقرة الأولى من محتوى HTML
        const match = content.match(/<p>(.*?)<\/p>/);
        return match ? match[1] : "";
    }

    function calculateReadingTime(content) {
        // حساب وقت القراءة التقريبي (نصف دقيقة لكل فقرة)
        const paragraphs = content.match(/<p>.*?<\/p>/g) || [];
        const minutes = Math.ceil(paragraphs.length * 0.5);
        return `${minutes} دقائق قراءة`;
    }

    function showStoryModal(story) {
        Swal.fire({
            title: story.title,
            html: `
                <div style="text-align: right; direction: rtl;">
                    <p><strong>الفئة:</strong> ${story.category}</p>
                    <p><strong>النوع:</strong> ${story.type}</p>
                    <hr>
                    ${story.content}
                </div>
            `,
            imageUrl: story.image,
            imageWidth: 400,
            imageHeight: 200,
            imageAlt: story.title,
            confirmButtonText: 'إغلاق',
            showCloseButton: true
        });
    }

    function displaySuccessStories() {
        const container = document.getElementById('successStoriesContainer');
        if (!container) return;

        container.innerHTML = '';

        successStories.forEach(story => {
            const storyCard = document.createElement('div');
            storyCard.className = 'story-card';

            const finalExcerpt = getExcerpt(story.content);
            const readingTime = calculateReadingTime(story.content);
            const typeIcon = story.type === 'مستفيد' ? 'fas fa-user-check' : 'fas fa-info-circle';

            storyCard.innerHTML = `
                <div class="story-image">
                    <img src="${story.image}" alt="${story.title}">
                    <div class="story-category">${story.category}</div>
                </div>
                <div class="story-content">
                    <h3>${story.title}</h3>
                    <div class="story-meta">
                        <span class="story-type"><i class="${typeIcon}"></i> ${story.type}</span>
                        <span class="story-time"><i class="far fa-clock"></i> ${readingTime}</span>
                    </div>
                    <p class="story-excerpt">${finalExcerpt}</p>
                    <button class="read-more" data-story-id="${story.id}">اقرأ القصة كاملة</button>
                </div>
            `;

            container.appendChild(storyCard);

            // إضافة معالج حدث لزر "اقرأ القصة كاملة"
            storyCard.querySelector('.read-more').addEventListener('click', () => {
                showStoryModal(story);
            });
        });
    }

    // ---------------------------------------------------------------------
    // 6. وظائف الفلترة (Filtering)
    // ---------------------------------------------------------------------

    function setupDonationFilters() {
        const typeFilterBtns = document.querySelectorAll('#type-filters .filter-btn');
        const statusFilterBtns = document.querySelectorAll('#status-filters .filter-btn');

        let currentTypeFilter = 'all';
        let currentStatusFilter = 'all';

        const applyFilters = () => {
            displayDonations(currentTypeFilter, currentStatusFilter);
        };

        // فلترة حسب النوع
        typeFilterBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const filter = this.getAttribute('data-filter');

                typeFilterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                currentTypeFilter = filter;
                applyFilters();
            });
        });

        // فلترة حسب الحالة
        statusFilterBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const filter = this.getAttribute('data-filter');

                statusFilterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                currentStatusFilter = filter;
                applyFilters();
            });
        });

        // تفعيل الفلتر الافتراضي عند التحميل
        // يجب أن يحتوي الزر "الكل" على كلاس active افتراضياً
    }

    // ---------------------------------------------------------------------
    // 7. وظائف الحوارات الجاهزة (Swal Dialogs)
    // ---------------------------------------------------------------------

    // نافذة التبرع (في قسم الكفالات/الحملات)
    const donationModal = document.getElementById('donationModal');
    const closeModal = document.getElementById('closeModal');
    // استخدمنا الآن دالة displaySponsorships/displayActiveCampaigns، يجب أن يكون زر التبرع
    // في HTML الأصلي للصفحة أو يتم ربطه بطريقة أخرى
    // إليك منطق نافذة التبرع (افتراضًا أن عناصر النافذة موجودة):
    document.querySelectorAll('.btn-donate').forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault(); // لمنع انتقال الصفحة
            const campaign = this.getAttribute('data-campaign');
            if (campaign && donationModal) {
                document.getElementById('campaignName').textContent = campaign;
                donationModal.classList.add('active');
            }
        });
    });

    if (closeModal) {
        closeModal.addEventListener('click', function () {
            donationModal.classList.remove('active');
        });
    }

    // تأكيد التبرع
    const confirmDonation = document.getElementById('confirmDonation');
    if (confirmDonation) {
        confirmDonation.addEventListener('click', function () {
            const amount = document.getElementById('donationAmount').value;
            const method = document.getElementById('paymentMethod').value;

            if (!amount || !method) {
                Swal.fire({
                    title: 'خطأ', text: 'يرجى ملء جميع الحقول', icon: 'error', confirmButtonText: 'حسناً'
                });
                return;
            }

            Swal.fire({
                title: 'تم التبرع بنجاح', text: `شكراً لتبرعك بمبلغ ${amount} د.ا`, icon: 'success', confirmButtonText: 'تم'
            });

            if (donationModal) donationModal.classList.remove('active');
        });
    }

    // عرض التفاصيل (لملخص الرصيد)
    const viewDetails = document.getElementById('viewDetails');
    if (viewDetails) {
        viewDetails.addEventListener('click', function () {
            Swal.fire({
                title: 'تفاصيل حالة التبرعات',
                html: `
                    <div style="text-align: right;">
                        <p><strong>تم الاستلام:</strong> 3,250 د.ا</p>
                        <p><strong>قيد التوصيل:</strong> 1,500 د.ا</p>
                        <p><strong>تم التوصيل:</strong> 1,000 د.ا</p>
                        <p><strong>المجموع:</strong> 5,750 د.ا</p>
                    </div>
                `,
                icon: 'info', confirmButtonText: 'تم'
            });
        });
    }

    // مشاركة الأثر
    const shareImpact = document.getElementById('shareImpact');
    if (shareImpact) {
        shareImpact.addEventListener('click', function () {
            Swal.fire({
                title: 'مشاركة الأثر',
                text: 'سيتم مشاركة إنجازك على وسائل التواصل الاجتماعي',
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'مشاركة',
                cancelButtonText: 'إلغاء'
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire('تم المشاركة!', 'تم مشاركة إنجازك بنجاح', 'success');
                }
            });
        });
    }

    // عرض كل التبرعات (الانتقال إلى تبويب سجل التبرعات)
    const viewAllDonations = document.getElementById('viewAllDonations');
    if (viewAllDonations) {
        viewAllDonations.addEventListener('click', function () {
            // تفعيل رابط "سجل التبرعات" (افترض أن له data-section="donations")
            const donationsLink = document.querySelector('.nav-links li[data-section="donations"]');
            if (donationsLink) donationsLink.click();
        });
    }

    // ---------------------------------------------------------------------
    // 8. وظائف تعديل كلمة المرور وتفاصيل الحساب (Settings Tab)
    // ---------------------------------------------------------------------

    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordGroup = document.getElementById('newPasswordGroup');
    const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const saveChangesBtn = document.getElementById('saveChanges');
    const cancelChangesBtn = document.getElementById('cancelChanges');

    let isChangingPassword = false;

    function resetPasswordForm() {
        isChangingPassword = false;
        if (changePasswordBtn) {
            changePasswordBtn.textContent = 'تغيير كلمة المرور';
            changePasswordBtn.style.background = '#fff3cd';
            changePasswordBtn.style.color = '#856404';
        }
        if (newPasswordGroup) newPasswordGroup.style.display = 'none';
        if (confirmPasswordGroup) confirmPasswordGroup.style.display = 'none';
        if (newPasswordInput) newPasswordInput.required = false;
        if (confirmPasswordInput) confirmPasswordInput.required = false;
        if (currentPasswordInput) currentPasswordInput.value = '';
        if (newPasswordInput) newPasswordInput.value = '';
        if (confirmPasswordInput) confirmPasswordInput.value = '';
    }

    function validatePasswordChange() {
        const currentPassword = currentPasswordInput ? currentPasswordInput.value : '';
        const newPassword = newPasswordInput ? newPasswordInput.value : '';
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

        if (!currentPassword) {
            Swal.fire({ title: 'خطأ', text: 'يرجى إدخال كلمة المرور الحالية', icon: 'error', confirmButtonText: 'حسناً' });
            return false;
        }
        if (newPassword.length < 6) {
            Swal.fire({ title: 'خطأ', text: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل', icon: 'error', confirmButtonText: 'حسناً' });
            return false;
        }
        if (newPassword !== confirmPassword) {
            Swal.fire({ title: 'خطأ', text: 'كلمات المرور غير متطابقة', icon: 'error', confirmButtonText: 'حسناً' });
            return false;
        }
        return true;
    }

    function changePassword() {
        Swal.fire({
            title: 'جاري تغيير كلمة المرور...', text: 'يرجى الانتظار', icon: 'info', showConfirmButton: false, allowOutsideClick: false
        });

        setTimeout(() => {
            Swal.fire({
                title: 'تم بنجاح', text: 'تم تغيير كلمة المرور بنجاح', icon: 'success', confirmButtonText: 'حسناً'
            });
            resetPasswordForm();
        }, 2000);
    }

    async function saveOtherChanges() {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const phone = document.getElementById('phone').value.trim();

        if (!firstName) {
            Swal.fire({
                title: 'خطأ',
                text: 'يرجى إدخال الاسم الأول',
                icon: 'error',
                confirmButtonText: 'حسناً'
            });
            return;
        }

        if (!lastName) {
            Swal.fire({
                title: 'خطأ',
                text: 'يرجى إدخال اسم العائلة',
                icon: 'error',
                confirmButtonText: 'حسناً'
            });
            return;
        }

        try {
            // Get token
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');

            if (!token) {
                Swal.fire({
                    title: 'خطأ',
                    text: 'يجب تسجيل الدخول أولاً',
                    icon: 'error',
                    confirmButtonText: 'حسناً'
                }).then(() => {
                    window.location.href = 'login.html';
                });
                return;
            }

            // Show loading
            Swal.fire({
                title: 'جاري حفظ التغييرات...',
                text: 'يرجى الانتظار',
                icon: 'info',
                showConfirmButton: false,
                allowOutsideClick: false
            });

            // Make API call
            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    firstName: firstName,
                    lastName: lastName,
                    phone: phone
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Update local userData
                userData.firstName = data.user.firstName;
                userData.lastName = data.user.lastName;
                userData.name = `${data.user.firstName} ${data.user.lastName}`;
                userData.email = data.user.email;
                userData.phone = data.user.phone || '';
                userData.donationGoal = data.user.donationGoal;

                // Update donation statistics from profile API
                if (data.user.totalDonationAmount !== undefined) {
                    userData.totalDonated = data.user.totalDonationAmount;
                }
                if (data.user.totalDonationRequests !== undefined) {
                    userData.helpedCases = data.user.totalDonationRequests;
                }

                // Update displays
                updateUserInfoDisplays();

                Swal.fire({
                    title: 'تم الحفظ',
                    text: 'تم حفظ التغييرات بنجاح',
                    icon: 'success',
                    confirmButtonText: 'حسناً'
                });
            } else {
                let errorMessage = 'حدث خطأ أثناء حفظ التغييرات';

                if (data.errors && data.errors.length > 0) {
                    errorMessage = data.errors.map(err => err.msg).join(', ');
                } else if (data.message) {
                    errorMessage = data.message;
                }

                Swal.fire({
                    title: 'خطأ',
                    text: errorMessage,
                    icon: 'error',
                    confirmButtonText: 'حسناً'
                });
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            Swal.fire({
                title: 'خطأ',
                text: 'حدث خطأ في الاتصال بالخادم',
                icon: 'error',
                confirmButtonText: 'حسناً'
            });
        }
    }

    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', function () {
            if (!isChangingPassword) {
                isChangingPassword = true;
                this.textContent = 'إلغاء تغيير كلمة المرور';
                this.style.background = '#f8d7da';
                this.style.color = '#721c24';

                if (newPasswordGroup) newPasswordGroup.style.display = 'block';
                if (confirmPasswordGroup) confirmPasswordGroup.style.display = 'block';
                if (newPasswordInput) newPasswordInput.required = true;
                if (confirmPasswordInput) confirmPasswordInput.required = true;
            } else {
                resetPasswordForm();
            }
        });
    }

    if (cancelChangesBtn) {
        cancelChangesBtn.addEventListener('click', function () {
            resetPasswordForm();
            Swal.fire({ title: 'تم الإلغاء', text: 'تم إلغاء التغييرات', icon: 'info', confirmButtonText: 'حسناً' });
        });
    }

    if (saveChangesBtn) {
        saveChangesBtn.addEventListener('click', function () {
            if (isChangingPassword) {
                if (validatePasswordChange()) {
                    changePassword();
                }
            } else {
                saveOtherChanges();
            }
        });
    }

    // ---------------------------------------------------------------------
    // 9. وظائف تحميل الأجزاء المشتركة (Navigation Bar & Footer Loading)
    // ---------------------------------------------------------------------

    async function loadHTML(file, elementId) {
        try {
            const response = await fetch(file);
            const data = await response.text();
            const container = document.getElementById(elementId);
            if (container) container.innerHTML = data;

            // إعادة تهيئة الأحداث للعناصر المنقولة
            if (file === 'navbar.html') {
                initNavbar();
            }

            return true;
        } catch (error) {
            console.error('Error loading HTML:', error);
            return false;
        }
    }

    function initNavbar() {
        const menuToggle = document.getElementById('menuToggle');
        const navLinksElement = document.getElementById('navLinks');

        if (!menuToggle || !navLinksElement) return;

        // تبديل القائمة في الجوال
        menuToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            navLinksElement.classList.toggle('active');
        });

        // إغلاق القائمة عند النقر خارجها
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.navbar')) {
                navLinksElement.classList.remove('active');
                document.querySelectorAll('.dropdown').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        });

        // منع إغلاق القائمة عند النقر عليها
        navLinksElement.addEventListener('click', function (e) {
            e.stopPropagation();
        });

        // تفعيل dropdown في الشاشات الصغيرة
        document.querySelectorAll('.dropdown-toggle').forEach(item => {
            item.addEventListener('click', function (e) {
                if (window.innerWidth <= 992) {
                    e.preventDefault();
                    const dropdown = this.parentNode;
                    dropdown.classList.toggle('active');

                    // إغلاق باقي القوائم
                    document.querySelectorAll('.dropdown').forEach(d => {
                        if (d !== dropdown) {
                            d.classList.remove('active');
                        }
                    });
                }
            });
        });

        // إغلاق القوائم المنسدلة عند تغيير حجم النافذة
        window.addEventListener('resize', function () {
            if (window.innerWidth > 992) {
                if (navLinksElement) navLinksElement.classList.remove('active');
                document.querySelectorAll('.dropdown').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        });
    }

    // عرض طلبات الكفالة - كفالة دورية لفترة محددة
    function displaySponsorRequests(filterCategory = 'all', filterStatus = 'all') {
        const sponsorRequestsList = document.getElementById('sponsorRequestsList');
        if (!sponsorRequestsList) return;

        sponsorRequestsList.innerHTML = '';
        const currency = ' د.ا';

        const filteredRequests = sponsorRequests.filter(request => {
            const categoryMatch = filterCategory === 'all' || request.category === filterCategory;
            const statusMatch = filterStatus === 'all' || request.status === filterStatus;
            return categoryMatch && statusMatch;
        });

        if (filteredRequests.length === 0) {
            sponsorRequestsList.innerHTML = '<li class="no-donations">لا توجد طلبات كفالة مطابقة لمرشحات البحث.</li>';
            return;
        }

        filteredRequests.forEach(request => {
            // الحصول على نصوص الفترة الزمنية
            const periodText = getPeriodText(request.paymentPeriod);
            const requestItem = document.createElement('li');
            requestItem.className = 'donation-item';
            requestItem.setAttribute('data-category', request.category);
            requestItem.setAttribute('data-status', request.status);

            let statusClass, statusText;
            if (request.status === 'completed') {
                statusClass = 'status-delivered';
                statusText = 'مكتمل';
            } else if (request.status === 'active') {
                statusClass = 'status-pending';
                statusText = 'نشط';
            } else {
                statusClass = 'status-received';
                statusText = 'قيد المراجعة';
            }

            // حساب التقدم بناءً على الفترات المكتملة
            const progressPercent = Math.round((request.completedPeriods / request.duration) * 100);
            const progressWidth = progressPercent > 100 ? 100 : progressPercent;

            // حساب المبلغ الإجمالي والمتبقي
            const totalAmount = request.amount * request.duration;
            const paidAmount = request.amount * request.completedPeriods;
            const remainingAmount = totalAmount - paidAmount;
            const remainingPeriods = request.duration - request.completedPeriods;

            requestItem.innerHTML = `
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 1.05em; color: #2c3e50;">${request.title}</div>
                    <div class="donation-date">${request.date}</div>
                    <div style="font-size: 0.9em; color: #666; margin-top: 5px;">${request.description}</div>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    
                    <!-- معلومات الكفالة الدورية -->
                    <div style="margin-top: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px; border-right: 4px solid #4CAF50;">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 0.9em;">
                            <div>
                                <span style="color: #666;">المبلغ ${periodText.adjective}:</span>
                                <strong style="color: #2c3e50; margin-right: 5px;">${request.amount.toLocaleString()}${currency}</strong>
                            </div>
                            <div>
                                <span style="color: #666;">مدة الكفالة:</span>
                                <strong style="color: #2c3e50; margin-right: 5px;">${request.duration} ${request.duration > 10 ? periodText.plural : periodText.singular}</strong>
                            </div>
                            <div>
                                <span style="color: #666;">${periodText.plural} المكتملة:</span>
                                <strong style="color: #28a745; margin-right: 5px;">${request.completedPeriods} ${request.completedPeriods > 10 ? periodText.plural : periodText.singular}</strong>
                            </div>
                            <div>
                                <span style="color: #666;">${periodText.plural} المتبقية:</span>
                                <strong style="color: #ff9800; margin-right: 5px;">${remainingPeriods} ${remainingPeriods > 10 ? periodText.plural : periodText.singular}</strong>
                            </div>
                        </div>
                    </div>
                    
                    <!-- شريط التقدم -->
                    <div class="progress-bar" style="margin-top: 12px; height: 10px; background: #e0e0e0; border-radius: 5px; overflow: hidden;">
                        <div class="progress-fill" style="width: ${progressWidth}%; height: 100%; background: linear-gradient(90deg, #4CAF50 0%, #45a049 100%); transition: width 0.3s ease;"></div>
                    </div>
                    
                    <!-- ملخص المبالغ -->
                    <div style="display: flex; justify-content: space-between; font-size: 0.85em; color: #666; margin-top: 8px;">
                        <span>المبلغ المدفوع: <strong style="color: #28a745;">${paidAmount.toLocaleString()}${currency}</strong></span>
                        <span>المبلغ المتبقي: <strong style="color: #ff9800;">${remainingAmount.toLocaleString()}${currency}</strong></span>
                        <span>الإجمالي: <strong style="color: #2c3e50;">${totalAmount.toLocaleString()}${currency}</strong></span>
                    </div>
                    
                    <div style="font-size: 0.85em; color: #2c3e50; margin-top: 8px; font-weight: 500;">
                        <i class="fas fa-chart-line" style="color: #4CAF50; margin-left: 5px;"></i>
                        نسبة الإنجاز: ${progressPercent}%
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 10px; min-width: 180px;">
                    <div style="text-align: center; width: 100%;">
                        <div style="font-size: 0.85em; color: #666; margin-bottom: 5px;">المبلغ ${periodText.adjective}</div>
                        <div class="donation-value" style="font-size: 1.3em; color: #4CAF50;">${request.amount.toLocaleString()}${currency}</div>
                        <div style="font-size: 0.75em; color: #999; margin-top: 3px;">لمدة ${request.duration} ${request.duration > 10 ? periodText.plural : periodText.singular}</div>
                    </div>
                    ${request.status !== 'completed' ? `
                        <button class="btn btn-donate" style="padding: 10px 20px; font-size: 0.9em; width: 100%; background: #4CAF50; border: none; border-radius: 6px; cursor: pointer; transition: background 0.3s;" data-request-id="${request.id}">
                            <i class="fas fa-hand-holding-heart" style="margin-left: 5px;"></i>
                            كفالة ${periodText.adjectiveFeminine}
                        </button>
                    ` : `
                        <div style="padding: 10px; background: #e8f5e9; color: #2e7d32; border-radius: 6px; text-align: center; width: 100%; font-size: 0.9em;">
                            <i class="fas fa-check-circle" style="margin-left: 5px;"></i>
                            الكفالة مكتملة
                        </div>
                    `}
                </div>
            `;

            // إضافة معالج حدث لزر الكفالة
            const donateBtn = requestItem.querySelector('.btn-donate');
            if (donateBtn) {
                donateBtn.addEventListener('click', () => {
                    const periodLabel = remainingPeriods === 1 ? periodText.singular : (remainingPeriods > 10 ? periodText.plural : periodText.plural);

                    Swal.fire({
                        title: `كفالة ${periodText.adjectiveFeminine}`,
                        html: `
                            <div style="text-align: right; direction: rtl; padding: 15px;">
                                <h4 style="color: #2c3e50; margin-bottom: 15px;">${request.title}</h4>
                                <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">${request.description}</p>
                                
                                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                        <span style="color: #666;">المبلغ ${periodText.adjective}:</span>
                                        <strong style="color: #4CAF50; font-size: 1.2em;">${request.amount.toLocaleString()}${currency}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                        <span style="color: #666;">مدة الكفالة:</span>
                                        <strong>${request.duration} ${request.duration > 10 ? periodText.plural : periodText.singular}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                        <span style="color: #666;">${periodText.plural} المتبقية:</span>
                                        <strong style="color: #ff9800;">${remainingPeriods} ${periodLabel}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px dashed #ddd;">
                                        <span style="color: #666;">المبلغ المتبقي الإجمالي:</span>
                                        <strong style="color: #2c3e50; font-size: 1.1em;">${remainingAmount.toLocaleString()}${currency}</strong>
                                    </div>
                                </div>
                                
                                <p style="color: #999; font-size: 0.9em; margin-top: 15px;">
                                    <i class="fas fa-info-circle" style="margin-left: 5px;"></i>
                                    يمكنك المساهمة بكفالة ${periodText.singular} واحد أو أكثر
                                </p>
                            </div>
                        `,
                        input: 'number',
                        inputLabel: `عدد ${periodText.plural} للكفالة`,
                        inputPlaceholder: `أدخل عدد ${periodText.plural} (الحد الأقصى: ${remainingPeriods})`,
                        inputAttributes: {
                            min: 1,
                            max: remainingPeriods,
                            step: 1
                        },
                        showCancelButton: true,
                        confirmButtonText: 'تأكيد الكفالة',
                        cancelButtonText: 'إلغاء',
                        confirmButtonColor: '#4CAF50',
                        inputValidator: (value) => {
                            if (!value || isNaN(value) || Number(value) <= 0) {
                                return `الرجاء إدخال عدد صحيح من ${periodText.plural}`;
                            }
                            if (Number(value) > remainingPeriods) {
                                return `الحد الأقصى هو ${remainingPeriods} ${periodLabel}`;
                            }
                        }
                    }).then((result) => {
                        if (result.isConfirmed) {
                            const periods = Number(result.value);
                            const totalPayment = periods * request.amount;
                            const selectedPeriodLabel = periods === 1 ? periodText.singular : (periods > 10 ? periodText.plural : periodText.plural);

                            Swal.fire({
                                title: 'تم التأكيد بنجاح!',
                                html: `
                                    <div style="text-align: center; padding: 20px;">
                                        <i class="fas fa-check-circle" style="color: #4CAF50; font-size: 4em; margin-bottom: 15px;"></i>
                                        <h3 style="color: #2c3e50; margin-bottom: 15px;">شكراً لكرمك!</h3>
                                        <p style="color: #666; margin-bottom: 20px;">تم تأكيد كفالتك ${periodText.adjectiveFeminine}</p>
                                        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                                            <div style="margin-bottom: 15px;">
                                                <div style="color: #666; font-size: 0.9em;">عدد ${periodText.plural}</div>
                                                <div style="color: #2c3e50; font-size: 1.5em; font-weight: bold;">${periods} ${selectedPeriodLabel}</div>
                                            </div>
                                            <div style="margin-bottom: 15px;">
                                                <div style="color: #666; font-size: 0.9em;">المبلغ ${periodText.adjective}</div>
                                                <div style="color: #4CAF50; font-size: 1.3em; font-weight: bold;">${request.amount.toLocaleString()}${currency}</div>
                                            </div>
                                            <div style="padding-top: 15px; border-top: 2px dashed #ddd;">
                                                <div style="color: #666; font-size: 0.9em;">المبلغ الإجمالي</div>
                                                <div style="color: #2c3e50; font-size: 1.8em; font-weight: bold;">${totalPayment.toLocaleString()}${currency}</div>
                                            </div>
                                        </div>
                                        <p style="color: #999; font-size: 0.9em;">سيتم خصم المبلغ ${periodText.adjective} بشكل تلقائي</p>
                                    </div>
                                `,
                                icon: 'success',
                                confirmButtonText: 'تم',
                                confirmButtonColor: '#4CAF50'
                            });
                        }
                    });
                });

                // تأثير hover للزر
                donateBtn.addEventListener('mouseenter', function () {
                    this.style.background = '#45a049';
                });
                donateBtn.addEventListener('mouseleave', function () {
                    this.style.background = '#4CAF50';
                });
            }

            sponsorRequestsList.appendChild(requestItem);
        });
    }

    // عرض معلومات الدفعة القادمة للكفالات
    function displayNextPaymentInfo() {
        const container = document.getElementById('nextPaymentInfo');
        if (!container) return;


        const currency = ' د.ا';

        // البحث عن الكفالة النشطة ذات أقرب موعد دفع
        const activeSponsorships = userActiveSponsorships.filter(s => s.status === 'active');


        if (activeSponsorships.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 30px;">
                    <i class="fas fa-info-circle" style="font-size: 3em; color: #ccc; margin-bottom: 15px;"></i>
                    <p style="color: #666;">لا توجد كفالات نشطة حالياً</p>
                    <p style="color: #999; font-size: 0.9em;">يمكنك تصفح طلبات الكفالة المتاحة والمساهمة</p>
                </div>
            `;
            return;
        }

        // ترتيب حسب تاريخ الدفع القادم
        const sortedSponsorships = activeSponsorships.sort((a, b) => {
            return new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate);
        });

        const latestThree = sortedSponsorships.slice(0, 3)
        latestThree.forEach(sponsorship => {
            const paymentDate = new Date(sponsorship.nextPaymentDate);
            const formattedDate = paymentDate.toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const sponsorShopItem = document.createElement('li');
            sponsorShopItem.className = 'donation-item';
            const today = new Date();
            const daysUntilPayment = Math.ceil((paymentDate - today) / (1000 * 60 * 60 * 24));

            let urgencyClass = '';
            let urgencyText = '';
            if (daysUntilPayment <= 3) {
                urgencyClass = 'urgent';
                urgencyText = 'عاجل';
            } else if (daysUntilPayment <= 7) {
                urgencyClass = 'soon';
                urgencyText = 'قريباً';
            }
            const periodText = getPeriodText(sponsorship.paymentPeriod);

            sponsorShopItem.innerHTML = `
                <div>
                    <div>${sponsorship.title.trim()}</div>
                    <div class="donation-date">${formattedDate}</div>
                </div>
                <div>
                    <div class="donation-value">${sponsorship.amount.toLocaleString()}${currency} (${periodText.adjective})</div>
                    <div class="${urgencyClass}">${urgencyText}</div>
                </div>
            `;

            container.appendChild(sponsorShopItem);
        });
    }

    // معالج زر عرض جميع الكفالات
    const viewAllSponsorshipsBtn = document.getElementById('viewAllSponsorships');
    if (viewAllSponsorshipsBtn) {
        viewAllSponsorshipsBtn.addEventListener('click', function () {
            // الانتقال إلى تبويب سجل الكفالات
            const sponsorsLink = document.querySelector('.nav-links li[data-section="sponsors"]');
            if (sponsorsLink) sponsorsLink.click();
        });
    }

    // إعداد فلاتر طلبات الكفالة
    function setupSponsorRequestsFilters() {
        const typeFilterBtns = document.querySelectorAll('#sponsor-type-filters .filter-btn');
        const statusFilterBtns = document.querySelectorAll('#sponsor-status-filters .filter-btn');

        let currentTypeFilter = 'all';
        let currentStatusFilter = 'all';

        const applyFilters = () => {
            displaySponsorRequests(currentTypeFilter, currentStatusFilter);
        };

        // فلترة حسب النوع
        typeFilterBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const filter = this.getAttribute('data-filter');

                typeFilterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                currentTypeFilter = filter;
                applyFilters();
            });
        });

        // فلترة حسب الحالة
        statusFilterBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const filter = this.getAttribute('data-filter');

                statusFilterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                currentStatusFilter = filter;
                applyFilters();
            });
        });
    }

    // ---------------------------------------------------------------------
    // 10. تهيئة كل شيء عند تحميل الصفحة (Initialization)
    // ---------------------------------------------------------------------

    // Load user data first, then initialize everything else
    async function initializePage() {
        // Fetch user data from backend
        await fetchUserData();

        // Fetch donation payments from API
        await fetchDonationPayments();

        // Load shared components
        await loadHTML('navbar.html', 'navbar-container');
        await loadHTML('footer.html', 'footer-container');

        // Initialize all displays
        updateStatCards();
        displayActiveCampaigns();
        displayDonations();
        displaySponsorRequests();
        displaySuccessStories();
        displayLatestDonations();
        displayNextPaymentInfo();
        setupDonationFilters();
        setupSponsorRequestsFilters();
    }

    // Start initialization
    initializePage();
});