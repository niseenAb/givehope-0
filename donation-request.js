// JavaScript for Arabic Donation Request Page

document.addEventListener('DOMContentLoaded', function() {
    // Get form elements
    const donationRequestForm = document.getElementById('donationRequestForm');
    const requestTypeSelect = document.getElementById('requestType');
    const dynamicFormSection = document.getElementById('dynamicFormSection');
    const dynamicFormContent = document.getElementById('dynamicFormContent');
    const dynamicFormTitle = document.getElementById('dynamicFormTitle');
    
    // Success modal
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
    const successMessage = document.getElementById('successMessage');

    // API Configuration
    const API_URL = 'http://localhost:5000/api/donation-requests';

    // Progress steps
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');

    // Arabic messages
    const messages = {
        success: {
            donationRequest: 'تم تقديم طلب التبرع بنجاح! سيتم مراجعة طلبك والتواصل معك قريباً على {email}.'
        },
        validation: {
            emailInvalid: 'يرجى إدخال عنوان بريد إلكتروني صحيح',
            fieldRequired: 'هذا الحقل مطلوب'
        }
    };

    // Required documents for each request type
    const requiredDocuments = {
        education: [
            'صورة عن الهوية الشخصية',
            'إثبات قيد من المؤسسة التعليمية',
            'كشف علامات آخر فصل دراسي',
            'فاتورة الرسوم الدراسية',
            'شهادة دخل الأسرة أو إثبات الحالة المادية'
        ],
        health: [
            'صورة عن الهوية الشخصية',
            'تقرير طبي مفصل من الطبيب المعالج',
            'فواتير العلاج أو تقدير التكاليف',
            'نتائج الفحوصات والتحاليل الطبية',
            'وصفة طبية (إن وجدت)',
            'شهادة دخل الأسرة'
        ],
        living: [
            'صورة عن الهوية الشخصية',
            'إثبات العنوان السكني (فاتورة كهرباء/ماء)',
            'عقد الإيجار (إن وجد)',
            'شهادة دخل الأسرة',
            'كشف عائلي أو ما يثبت عدد أفراد الأسرة',
            'فواتير أو تقديرات تكاليف الاحتياجات المطلوبة'
        ],
        sponsoring: [
            'صورة عن هوية المستفيد',
            'صورة شخصية للمستفيد',
            'شهادة ميلاد المستفيد',
            'كشف عائلي',
            'تقرير اجتماعي عن الحالة',
            'شهادة دخل الأسرة أو الكفيل الحالي'
        ],
        emergency: [
            'صورة عن الهوية الشخصية',
            'تقرير من الجهات المختصة (شرطة، دفاع مدني، إلخ)',
            'صور توثيقية للحادث/الطارئ',
            'فواتير أو تقديرات التكاليف',
            'شهادات طبية (إن وجدت)',
            'أي مستندات داعمة أخرى'
        ],
        other: [
            'صورة عن الهوية الشخصية',
            'مستندات توضح طبيعة الطلب',
            'فواتير أو تقديرات تكاليف',
            'شهادة دخل الأسرة',
            'أي مستندات داعمة أخرى'
        ]
    };

    // Required documents for each sponsorship type
    const sponsorshipRequiredDocuments = {
        'كفالة يتيم': [
            'صورة عن هوية اليتيم',
            'صورة شخصية لليتيم',
            'شهادة ميلاد اليتيم',
            'شهادة وفاة الوالد/الوالدة',
            'كشف عائلي',
            'إثبات قيد من المؤسسة التعليمية (إن كان ملتحقاً)',
            'صورة عن هوية الوصي/الكفيل الحالي',
            'تقرير اجتماعي عن حالة اليتيم',
            'شهادة دخل الأسرة أو الكفيل الحالي'
        ],
        'كفالة أسرة': [
            'صورة عن هوية رب الأسرة',
            'كشف عائلي يثبت عدد أفراد الأسرة',
            'شهادات ميلاد الأطفال',
            'إثبات العنوان السكني (فاتورة كهرباء/ماء)',
            'عقد الإيجار (إن وجد)',
            'شهادة دخل الأسرة',
            'تقرير اجتماعي عن حالة الأسرة',
            'شهادات طبية (لكبار السن أو ذوي الاحتياجات الخاصة - إن وجد)',
            'فواتير أو كشوفات المصاريف الشهرية'
        ],
        'كفالة طالب علم': [
            'صورة عن هوية الطالب',
            'صورة شخصية للطالب',
            'شهادة ميلاد الطالب',
            'إثبات قيد من المؤسسة التعليمية',
            'كشف علامات آخر فصل دراسي',
            'قبول جامعي أو ما يثبت التخصص الدراسي',
            'فاتورة الرسوم الدراسية',
            'شهادة دخل الأسرة',
            'تقرير اجتماعي عن الحالة المالية للطالب',
            'شهادة حسن سيرة وسلوك من المؤسسة التعليمية'
        ],
        'كفالة مريض': [
            'صورة عن هوية المريض',
            'صورة شخصية للمريض',
            'تقرير طبي مفصل من الطبيب المعالج',
            'نتائج الفحوصات والتحاليل الطبية',
            'فواتير العلاج أو تقدير التكاليف',
            'وصفة طبية موثقة',
            'كشف عائلي',
            'شهادة دخل الأسرة',
            'تقرير اجتماعي عن حالة المريض',
            'خطة علاجية من المستشفى أو المركز الطبي'
        ],
        'كفالة شاملة': [
            'صورة عن هوية المستفيد',
            'صورة شخصية للمستفيد',
            'شهادة ميلاد المستفيد',
            'كشف عائلي',
            'إثبات القيد التعليمي (إن كان طالباً)',
            'تقارير طبية (إن كانت هناك احتياجات صحية)',
            'إثبات العنوان السكني',
            'شهادة دخل الأسرة',
            'تقرير اجتماعي شامل عن الحالة',
            'فواتير وكشوفات للاحتياجات المختلفة',
            'أي مستندات أخرى تدعم الطلب'
        ]
    };

    // Dynamic form templates for different request types
    const dynamicFormTemplates = {
        education: {
            title: 'تفاصيل طلب التعليم',
            icon: 'fas fa-graduation-cap',
            fields: [
                { id: 'educationLevel', label: 'المستوى التعليمي', type: 'select', options: ['ابتدائي', 'متوسط', 'ثانوي', 'جامعي', 'دراسات عليا'], required: true },
                { id: 'institution', label: 'اسم المؤسسة التعليمية', type: 'text', required: true },
                { id: 'tuitionAmount', label: 'مبلغ الرسوم المطلوب (شيكل)', type: 'number', required: true },
                { id: 'academicYear', label: 'السنة الأكاديمية', type: 'text', placeholder: 'مثال: 2024-2025', required: true },
                { id: 'educationReason', label: 'سبب طلب المساعدة التعليمية', type: 'textarea', required: true }
            ]
        },
        health: {
            title: 'تفاصيل طلب الصحة',
            icon: 'fas fa-heartbeat',
            fields: [
                { id: 'medicalCondition', label: 'الحالة الطبية', type: 'text', required: true },
                { id: 'hospital', label: 'اسم المستشفى/العيادة', type: 'text', required: true },
                { id: 'treatmentCost', label: 'تكلفة العلاج المطلوبة (شيكل)', type: 'number', required: true },
                { id: 'doctorName', label: 'اسم الطبيب المعالج', type: 'text', required: false },
                { id: 'medicalUrgency', label: 'مستوى الإلحاح الطبي', type: 'select', options: ['عادي', 'مهم', 'عاجل', 'طارئ'], required: true },
                { id: 'medicalDetails', label: 'تفاصيل الحالة الطبية', type: 'textarea', required: true }
            ]
        },
        living: {
            title: 'تفاصيل طلب المعيشة',
            icon: 'fas fa-house-user',
            fields: [
                { id: 'assistanceType', label: 'نوع المساعدة المطلوبة', type: 'select', options: ['سكن - إيجار', 'سكن - إصلاحات', 'سكن - أثاث', 'طعام - مواد غذائية', 'طعام - وجبات', 'مساعدة شاملة'], required: true },
                { id: 'familySize', label: 'عدد أفراد الأسرة', type: 'number', required: true },
                { id: 'childrenCount', label: 'عدد الأطفال', type: 'number', required: true },
                { id: 'monthlyAmount', label: 'المبلغ الشهري المطلوب (شيكل)', type: 'number', required: true },
                { id: 'assistanceDuration', label: 'مدة المساعدة المطلوبة (بالأشهر)', type: 'number', required: true },
                { id: 'currentSituation', label: 'الوضع الحالي', type: 'textarea', required: true },
                { id: 'livingReason', label: 'سبب طلب المساعدة المعيشية', type: 'textarea', required: true }
            ]
        },
        sponsoring: {
            title: 'تفاصيل طلب الكفالة',
            icon: 'fas fa-hands-helping',
            fields: [
                { id: 'sponsorshipType', label: 'نوع الكفالة', type: 'select', options: ['كفالة يتيم', 'كفالة أسرة', 'كفالة طالب علم', 'كفالة مريض', 'كفالة شاملة'], required: true }
            ],
            hasDynamicFields: true
        },
        emergency: {
            title: 'تفاصيل طلب الطوارئ',
            icon: 'fas fa-exclamation-triangle',
            fields: [
                { id: 'emergencyType', label: 'نوع الطارئ', type: 'select', options: ['حريق', 'فيضان', 'حادث', 'وفاة', 'مرض مفاجئ', 'فقدان وظيفة', 'أخرى'], required: true },
                { id: 'emergencyAmount', label: 'المبلغ المطلوب (شيكل)', type: 'number', required: true },
                { id: 'emergencyDate', label: 'تاريخ الطارئ', type: 'date', required: true },
                { id: 'affectedPersons', label: 'عدد الأشخاص المتضررين', type: 'number', required: true },
                { id: 'emergencyLocation', label: 'مكان الطارئ', type: 'text', required: true },
                { id: 'emergencyDetails', label: 'تفاصيل الطارئ', type: 'textarea', required: true }
            ]
        },
        other: {
            title: 'تفاصيل الطلب',
            icon: 'fas fa-clipboard-list',
            fields: [
                { id: 'requestCategory', label: 'فئة الطلب', type: 'text', placeholder: 'مثال: تعليم، صحة، إلخ', required: true },
                { id: 'requestAmount', label: 'المبلغ المطلوب (شيكل)', type: 'number', required: true },
                { id: 'requestPurpose', label: 'الغرض من الطلب', type: 'textarea', required: true },
                { id: 'additionalInfo', label: 'معلومات إضافية', type: 'textarea', required: false }
            ]
        }
    };

    // Request type change handler for dynamic form generation
    requestTypeSelect.addEventListener('change', function() {
        const selectedType = this.value;
        if (selectedType && dynamicFormTemplates[selectedType]) {
            generateDynamicForm(selectedType);
            updateProgressSteps(2);
        } else {
            dynamicFormSection.classList.add('d-none');
            dynamicFormContent.innerHTML = '';
            updateProgressSteps(1);
        }
    });

    // Handle dynamic field changes for sponsorship type
    document.addEventListener('change', function(e) {
        if (e.target.id === 'sponsorshipType') {
            updateSponsorshipFields(e.target.value);
        }
    });

    // Update sponsorship fields based on selected type
    function updateSponsorshipFields(sponsorshipType) {
        const dynamicFieldsContainer = document.getElementById('dynamicSponsorshipFields');
        if (!dynamicFieldsContainer) return;

        // Clear existing dynamic fields
        dynamicFieldsContainer.innerHTML = '';

        // Update required documents for sponsorship type
        updateSponsorshipDocuments(sponsorshipType);

        // Define fields for each sponsorship type
        const sponsorshipTypeFields = {
            'كفالة يتيم': [
                { id: 'orphanName', label: 'اسم اليتيم', type: 'text', required: true },
                { id: 'orphanAge', label: 'عمر اليتيم', type: 'number', required: true },
                { id: 'orphanGender', label: 'الجنس', type: 'select', options: ['ذكر', 'أنثى'], required: true },
                { id: 'orphanEducationLevel', label: 'المستوى التعليمي', type: 'select', options: ['روضة', 'ابتدائي', 'متوسط', 'ثانوي', 'جامعي', 'غير ملتحق'], required: true },
                { id: 'guardianName', label: 'اسم الوصي/الكفيل الحالي', type: 'text', required: true },
                { id: 'guardianRelation', label: 'صلة القرابة بالوصي', type: 'text', placeholder: 'مثال: الجد، العم، الخال', required: true },
                { id: 'orphanStatus', label: 'حالة اليتم', type: 'select', options: ['يتيم الأب', 'يتيم الأم', 'يتيم الأبوين'], required: true },
                { id: 'paymentPeriod', label: 'نوع الدفع', type: 'select', options: ['شهري', 'فصلي', 'سنوي'], required: true },
                { id: 'sponsorshipAmount', label: 'مبلغ الكفالة لكل فترة (شيكل)', type: 'number', required: true },
                { id: 'sponsorshipDuration', label: 'عدد الفترات المطلوبة', type: 'number', placeholder: 'مثال: 12 شهر، 4 فصول، أو 2 سنة', required: true },
                { id: 'orphanNeeds', label: 'احتياجات اليتيم الأساسية', type: 'textarea', placeholder: 'صف الاحتياجات التعليمية، الصحية، المعيشية، إلخ', required: true }
            ],
            'كفالة أسرة': [
                { id: 'familyHead', label: 'اسم رب الأسرة', type: 'text', required: true },
                { id: 'familySize', label: 'عدد أفراد الأسرة', type: 'number', required: true },
                { id: 'childrenCount', label: 'عدد الأطفال', type: 'number', required: true },
                { id: 'eldersCount', label: 'عدد كبار السن', type: 'number', required: false },
                { id: 'disabledCount', label: 'عدد ذوي الاحتياجات الخاصة', type: 'number', required: false },
                { id: 'familyIncome', label: 'الدخل الشهري للأسرة (شيكل)', type: 'number', required: true },
                { id: 'paymentPeriod', label: 'نوع الدفع', type: 'select', options: ['شهري', 'فصلي', 'سنوي'], required: true },
                { id: 'sponsorshipAmount', label: 'مبلغ الكفالة لكل فترة (شيكل)', type: 'number', required: true },
                { id: 'sponsorshipDuration', label: 'عدد الفترات المطلوبة', type: 'number', placeholder: 'مثال: 12 شهر، 4 فصول، أو 2 سنة', required: true },
                { id: 'housingStatus', label: 'حالة السكن', type: 'select', options: ['ملك', 'إيجار', 'مع العائلة', 'أخرى'], required: true },
                { id: 'familyCircumstances', label: 'الظروف العائلية والأسباب', type: 'textarea', placeholder: 'اشرح الوضع الاقتصادي والاجتماعي للأسرة', required: true }
            ],
            'كفالة طالب علم': [
                { id: 'studentName', label: 'اسم الطالب', type: 'text', required: true },
                { id: 'studentAge', label: 'عمر الطالب', type: 'number', required: true },
                { id: 'educationLevel', label: 'المستوى التعليمي', type: 'select', options: ['ابتدائي', 'متوسط', 'ثانوي', 'جامعي - بكالوريوس', 'جامعي - ماجستير', 'جامعي - دكتوراه'], required: true },
                { id: 'institution', label: 'اسم المؤسسة التعليمية', type: 'text', required: true },
                { id: 'major', label: 'التخصص الدراسي', type: 'text', required: true },
                { id: 'gpa', label: 'المعدل الدراسي', type: 'number', step: '0.01', placeholder: 'مثال: 3.5', required: true },
                { id: 'tuitionAmount', label: 'الرسوم الدراسية الفصلية/السنوية (شيكل)', type: 'number', required: true },
                { id: 'paymentPeriod', label: 'نوع الدفع', type: 'select', options: ['شهري', 'فصلي', 'سنوي'], required: true },
                { id: 'sponsorshipAmount', label: 'مبلغ الكفالة لكل فترة (شيكل)', type: 'number', required: true },
                { id: 'sponsorshipDuration', label: 'عدد الفترات المطلوبة', type: 'number', placeholder: 'مثال: 12 شهر، 4 فصول، أو 2 سنة', required: true },
                { id: 'studentCircumstances', label: 'الظروف المالية للطالب', type: 'textarea', placeholder: 'اشرح الوضع المالي والأسباب التي تستدعي الكفالة', required: true }
            ],
            'كفالة مريض': [
                { id: 'patientName', label: 'اسم المريض', type: 'text', required: true },
                { id: 'patientAge', label: 'عمر المريض', type: 'number', required: true },
                { id: 'medicalCondition', label: 'التشخيص الطبي', type: 'text', placeholder: 'نوع المرض أو الحالة الصحية', required: true },
                { id: 'treatmentType', label: 'نوع العلاج المطلوب', type: 'select', options: ['علاج دوائي', 'علاج طبيعي', 'غسيل كلى', 'علاج كيماوي', 'عملية جراحية', 'متابعة مستمرة', 'أخرى'], required: true },
                { id: 'hospital', label: 'المستشفى/المركز الطبي', type: 'text', required: true },
                { id: 'doctorName', label: 'اسم الطبيب المعالج', type: 'text', required: true },
                { id: 'treatmentDuration', label: 'مدة العلاج المتوقعة (بالأشهر)', type: 'number', required: true },
                { id: 'monthlyCost', label: 'التكلفة الشهرية للعلاج (شيكل)', type: 'number', required: true },
                { id: 'paymentPeriod', label: 'نوع الدفع', type: 'select', options: ['شهري', 'فصلي', 'سنوي'], required: true },
                { id: 'sponsorshipAmount', label: 'مبلغ الكفالة لكل فترة (شيكل)', type: 'number', required: true },
                { id: 'sponsorshipDuration', label: 'عدد الفترات المطلوبة', type: 'number', placeholder: 'مثال: 12 شهر، 4 فصول، أو 2 سنة', required: true },
                { id: 'patientCircumstances', label: 'الوضع الصحي والمالي للمريض', type: 'textarea', placeholder: 'اشرح تفاصيل الحالة الصحية والاحتياجات المالية', required: true }
            ],
            'كفالة شاملة': [
                { id: 'beneficiaryName', label: 'اسم المستفيد', type: 'text', required: true },
                { id: 'beneficiaryAge', label: 'عمر المستفيد', type: 'number', required: true },
                { id: 'beneficiaryType', label: 'نوع المستفيد', type: 'select', options: ['فرد', 'أسرة', 'طالب', 'مريض', 'مسن', 'ذو إعاقة'], required: true },
                { id: 'familySize', label: 'عدد أفراد الأسرة (إن وجد)', type: 'number', required: false },
                { id: 'needsCategories', label: 'فئات الاحتياجات', type: 'select', options: ['تعليم وصحة', 'معيشة وسكن', 'تعليم ومعيشة', 'صحة ومعيشة', 'جميع الفئات'], required: true },
                { id: 'educationNeeds', label: 'الاحتياجات التعليمية', type: 'textarea', placeholder: 'صف الاحتياجات التعليمية إن وجدت', required: false },
                { id: 'healthNeeds', label: 'الاحتياجات الصحية', type: 'textarea', placeholder: 'صف الاحتياجات الصحية إن وجدت', required: false },
                { id: 'livingNeeds', label: 'احتياجات المعيشة', type: 'textarea', placeholder: 'صف احتياجات المعيشة الأساسية', required: false },
                { id: 'paymentPeriod', label: 'نوع الدفع', type: 'select', options: ['شهري', 'فصلي', 'سنوي'], required: true },
                { id: 'sponsorshipAmount', label: 'مبلغ الكفالة لكل فترة (شيكل)', type: 'number', required: true },
                { id: 'sponsorshipDuration', label: 'عدد الفترات المطلوبة', type: 'number', placeholder: 'مثال: 12 شهر، 4 فصول، أو 2 سنة', required: true },
                { id: 'comprehensiveDetails', label: 'تفاصيل شاملة عن الحالة', type: 'textarea', placeholder: 'اشرح بالتفصيل جميع جوانب الحالة والاحتياجات', required: true }
            ]
        };

        const fields = sponsorshipTypeFields[sponsorshipType];
        if (fields && fields.length > 0) {
            let html = '';
            fields.forEach(field => {
                html += createFieldHTML(field);
            });
            dynamicFieldsContainer.innerHTML = html;

            // Apply RTL styling to new inputs
            const newInputs = dynamicFieldsContainer.querySelectorAll('input[type="text"], input[type="email"], input[type="number"], textarea');
            newInputs.forEach(input => {
                input.style.textAlign = 'right';
            });
        }
    }

    // Generate dynamic form based on request type
    function generateDynamicForm(requestType) {
        const template = dynamicFormTemplates[requestType];
        dynamicFormTitle.innerHTML = `<i class="${template.icon} ms-2"></i>${template.title}`;
        
        let formHTML = '';
        template.fields.forEach(field => {
            formHTML += createFieldHTML(field);
        });
        
        // Add dynamic sponsorship fields container if this is a sponsorship request
        if (template.hasDynamicFields) {
            formHTML += `
                <div id="dynamicSponsorshipFields" class="mt-4 p-4 bg-light rounded border border-info">
                    <div class="alert alert-info mb-0">
                        <i class="fas fa-info-circle ms-2"></i>
                        يرجى اختيار نوع الكفالة أولاً لعرض الحقول المطلوبة
                    </div>
                </div>
            `;
        }
        
        // Add required documents section
        formHTML += generateRequiredDocumentsSection(requestType);
        
        dynamicFormContent.innerHTML = formHTML;
        dynamicFormSection.classList.remove('d-none');
        
        // Apply RTL styling to new inputs
        const newInputs = dynamicFormContent.querySelectorAll('input[type="text"], input[type="email"], input[type="number"], textarea');
        newInputs.forEach(input => {
            input.style.textAlign = 'right';
        });
    }

    // Update required documents for sponsorship type
    function updateSponsorshipDocuments(sponsorshipType) {
        const documentsContainer = document.getElementById('sponsorshipDocumentsContainer');
        if (!documentsContainer) return;

        const documents = sponsorshipRequiredDocuments[sponsorshipType];
        if (!documents || documents.length === 0) {
            documentsContainer.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle ms-2"></i>
                    يرجى اختيار نوع الكفالة لعرض المستندات المطلوبة
                </div>
            `;
            return;
        }

        let html = `
            <div class="alert alert-info mb-3">
                <i class="fas fa-info-circle ms-2"></i>
                <strong>مهم:</strong> يرجى رفع المستندات التالية الخاصة بـ<strong>${sponsorshipType}</strong>. الملفات المقبولة: PDF, JPG, PNG, DOCX (حجم أقصى: 5 ميجابايت لكل ملف)
            </div>
        `;

        documents.forEach((doc, index) => {
            const docId = `document_sponsoring_${sponsorshipType.replace(/\s+/g, '_')}_${index}`;
            html += `
                <div class="mb-3">
                    <label for="${docId}" class="form-label fw-semibold">
                        <i class="fas fa-paperclip text-primary ms-1"></i>
                        ${doc} *
                    </label>
                    <div class="document-upload-wrapper">
                        <input type="file" 
                               class="form-control document-upload" 
                               id="${docId}" 
                               name="${docId}"
                               accept=".pdf,.jpg,.jpeg,.png,.docx"
                               required
                               data-document-name="${doc}">
                        <small class="form-text text-muted d-block mt-1">
                            <i class="fas fa-info-circle ms-1"></i>
                            الملفات المدعومة: PDF, JPG, PNG, DOCX (حجم أقصى: 5MB)
                        </small>
                        <div class="upload-feedback mt-2 d-none">
                            <span class="badge bg-success">
                                <i class="fas fa-check-circle ms-1"></i>
                                <span class="file-name"></span>
                            </span>
                            <button type="button" class="btn btn-sm btn-outline-danger ms-2 remove-file" style="padding: 0.25rem 0.5rem;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        documentsContainer.innerHTML = html;
    }

    // Generate required documents section with file upload
    function generateRequiredDocumentsSection(requestType) {
        const documents = requiredDocuments[requestType];
        if (!documents || documents.length === 0) return '';
        
        let html = `
            <div class="mt-4 p-4 bg-light rounded border border-primary" id="documentsSection">
                <h5 class="text-primary mb-3">
                    <i class="fas fa-file-upload ms-2"></i>
                    المستندات المطلوبة
                </h5>
                <div id="sponsorshipDocumentsContainer">
                    ${requestType === 'sponsoring' ? `
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle ms-2"></i>
                            يرجى اختيار نوع الكفالة أولاً لعرض المستندات المطلوبة
                        </div>
                    ` : ''}
                </div>
        `;
        
        // Only add document fields for non-sponsoring types
        if (requestType !== 'sponsoring') {
            html += `
                <div class="alert alert-info mb-3">
                    <i class="fas fa-info-circle ms-2"></i>
                    <strong>مهم:</strong> يرجى رفع المستندات التالية مع طلبك. الملفات المقبولة: PDF, JPG, PNG, DOCX (حجم أقصى: 5 ميجابايت لكل ملف)
                </div>
            `;
        }
        
        if (requestType !== 'sponsoring') {
            documents.forEach((doc, index) => {
                const docId = `document_${requestType}_${index}`;
                html += `
                    <div class="mb-3">
                        <label for="${docId}" class="form-label fw-semibold">
                            <i class="fas fa-paperclip text-primary ms-1"></i>
                            ${doc} *
                        </label>
                        <div class="document-upload-wrapper">
                            <input type="file" 
                                   class="form-control document-upload" 
                                   id="${docId}" 
                                   name="${docId}"
                                   accept=".pdf,.jpg,.jpeg,.png,.docx"
                                   required
                                   data-document-name="${doc}">
                            <small class="form-text text-muted d-block mt-1">
                                <i class="fas fa-info-circle ms-1"></i>
                                الملفات المدعومة: PDF, JPG, PNG, DOCX (حجم أقصى: 5MB)
                            </small>
                            <div class="upload-feedback mt-2 d-none">
                                <span class="badge bg-success">
                                    <i class="fas fa-check-circle ms-1"></i>
                                    <span class="file-name"></span>
                                </span>
                                <button type="button" class="btn btn-sm btn-outline-danger ms-2 remove-file" style="padding: 0.25rem 0.5rem;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        
        html += `
                <div class="mt-3 p-3 bg-white rounded border">
                    <small class="text-muted">
                        <i class="fas fa-shield-alt ms-1"></i>
                        <strong>الخصوصية والأمان:</strong> جميع المستندات المرفقة محمية ومشفرة وفقاً لسياسة الخصوصية الخاصة بنا. لن يتم مشاركة مستنداتك مع أي طرف ثالث.
                    </small>
                </div>

                <!-- Other Documents Section -->
                <div class="mt-4 p-4 bg-white rounded border border-secondary">
                    <h5 class="text-secondary mb-3">
                        <i class="fas fa-folder-plus ms-2"></i>
                        مستندات إضافية (اختياري)
                    </h5>
                    <p class="text-muted mb-3">
                        <i class="fas fa-info-circle ms-1"></i>
                        يمكنك إرفاق أي مستندات إضافية تدعم طلبك
                    </p>
                    <div id="otherDocumentsContainer">
                        <!-- Additional document uploads will be added here -->
                    </div>
                    <button type="button" class="btn btn-outline-primary btn-sm" id="addOtherDocumentBtn">
                        <i class="fas fa-plus ms-2"></i>
                        إضافة مستند إضافي
                    </button>
                </div>
            </div>
        `;
        
        return html;
    }

    // Handle adding other documents
    let otherDocumentCount = 0;
    document.addEventListener('click', function(e) {
        if (e.target.closest('#addOtherDocumentBtn')) {
            addOtherDocumentField();
        }
        
        // Handle removing other documents
        if (e.target.closest('.remove-other-doc')) {
            const docWrapper = e.target.closest('.other-doc-wrapper');
            docWrapper.remove();
        }
    });

    function addOtherDocumentField() {
        otherDocumentCount++;
        const docId = `other_document_${otherDocumentCount}`;
        const container = document.getElementById('otherDocumentsContainer');
        
        const docHTML = `
            <div class="other-doc-wrapper mb-3 p-3 bg-light rounded border">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <label for="${docId}" class="form-label fw-semibold mb-0">
                        <i class="fas fa-file text-secondary ms-1"></i>
                        مستند إضافي ${otherDocumentCount}
                    </label>
                    <button type="button" class="btn btn-sm btn-outline-danger remove-other-doc" style="padding: 0.25rem 0.5rem;">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
                <input type="text" 
                       class="form-control form-control-sm mb-2" 
                       id="${docId}_name" 
                       placeholder="اسم المستند (اختياري)">
                <input type="file" 
                       class="form-control form-control-sm other-document-upload" 
                       id="${docId}" 
                       name="${docId}"
                       accept=".pdf,.jpg,.jpeg,.png,.docx">
                <small class="form-text text-muted d-block mt-1">
                    <i class="fas fa-info-circle ms-1"></i>
                    الملفات المدعومة: PDF, JPG, PNG, DOCX (حجم أقصى: 5MB)
                </small>
                <div class="upload-feedback mt-2 d-none">
                    <span class="badge bg-success">
                        <i class="fas fa-check-circle ms-1"></i>
                        <span class="file-name"></span>
                    </span>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', docHTML);
    }

    // Handle other document uploads
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('other-document-upload')) {
            handleOtherFileUpload(e.target);
        }
    });

    function handleOtherFileUpload(input) {
        const file = input.files[0];
        const wrapper = input.closest('.other-doc-wrapper');
        const feedback = wrapper.querySelector('.upload-feedback');
        const fileNameSpan = wrapper.querySelector('.file-name');
        
        if (!file) {
            feedback.classList.add('d-none');
            input.classList.remove('is-valid', 'is-invalid');
            return;
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            input.classList.add('is-invalid');
            input.classList.remove('is-valid');
            alert('حجم الملف كبير جداً. الحجم الأقصى المسموح به هو 5 ميجابايت.');
            input.value = '';
            feedback.classList.add('d-none');
            return;
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            input.classList.add('is-invalid');
            input.classList.remove('is-valid');
            alert('نوع الملف غير مدعوم. يرجى رفع ملف PDF, JPG, PNG, أو DOCX.');
            input.value = '';
            feedback.classList.add('d-none');
            return;
        }

        // Show success feedback
        input.classList.add('is-valid');
        input.classList.remove('is-invalid');
        fileNameSpan.textContent = file.name;
        feedback.classList.remove('d-none');
    }

    // Handle file upload changes
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('document-upload')) {
            handleFileUpload(e.target);
        }
    });

    // Handle file removal
    document.addEventListener('click', function(e) {
        if (e.target.closest('.remove-file')) {
            const fileInput = e.target.closest('.document-upload-wrapper').querySelector('.document-upload');
            fileInput.value = '';
            const feedback = e.target.closest('.document-upload-wrapper').querySelector('.upload-feedback');
            feedback.classList.add('d-none');
            fileInput.classList.remove('is-valid');
        }
    });

    // Handle file upload
    function handleFileUpload(input) {
        const file = input.files[0];
        const wrapper = input.closest('.document-upload-wrapper');
        const feedback = wrapper.querySelector('.upload-feedback');
        const fileNameSpan = wrapper.querySelector('.file-name');
        
        if (!file) {
            feedback.classList.add('d-none');
            input.classList.remove('is-valid', 'is-invalid');
            return;
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            input.classList.add('is-invalid');
            input.classList.remove('is-valid');
            alert('حجم الملف كبير جداً. الحجم الأقصى المسموح به هو 5 ميجابايت.');
            input.value = '';
            feedback.classList.add('d-none');
            return;
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            input.classList.add('is-invalid');
            input.classList.remove('is-valid');
            alert('نوع الملف غير مدعوم. يرجى رفع ملف PDF, JPG, PNG, أو DOCX.');
            input.value = '';
            feedback.classList.add('d-none');
            return;
        }

        // Show success feedback
        input.classList.add('is-valid');
        input.classList.remove('is-invalid');
        fileNameSpan.textContent = file.name;
        feedback.classList.remove('d-none');
    }

    // Create HTML for individual form fields
    function createFieldHTML(field) {
        const requiredAttr = field.required ? 'required' : '';
        const requiredLabel = field.required ? ' *' : '';
        const placeholder = field.placeholder || field.label;
        
        let fieldHTML = `
            <div class="mb-3">
                <label for="${field.id}" class="form-label fw-semibold">${field.label}${requiredLabel}</label>
        `;
        
        if (field.type === 'select') {
            fieldHTML += `
                <div class="input-group">
                    <span class="input-group-text"><i class="fas fa-list text-primary"></i></span>
                    <select class="form-select" id="${field.id}" ${requiredAttr}>
                        <option value="">اختر...</option>
            `;
            field.options.forEach(option => {
                fieldHTML += `<option value="${option}">${option}</option>`;
            });
            fieldHTML += `
                    </select>
                </div>
            `;
        } else if (field.type === 'textarea') {
            fieldHTML += `
                <div class="input-group">
                    <span class="input-group-text"><i class="fas fa-comment text-primary"></i></span>
                    <textarea class="form-control" id="${field.id}" rows="3" placeholder="${placeholder}" ${requiredAttr}></textarea>
                </div>
            `;
        } else {
            const icon = getFieldIcon(field.type);
            fieldHTML += `
                <div class="input-group">
                    <span class="input-group-text"><i class="fas fa-${icon} text-primary"></i></span>
                    <input type="${field.type}" class="form-control" id="${field.id}" placeholder="${placeholder}" ${requiredAttr}>
                </div>
            `;
        }
        
        fieldHTML += '</div>';
        return fieldHTML;
    }

    // Get appropriate icon for field type
    function getFieldIcon(fieldType) {
        const iconMap = {
            'text': 'font',
            'number': 'hashtag',
            'date': 'calendar',
            'email': 'envelope',
            'tel': 'phone'
        };
        return iconMap[fieldType] || 'font';
    }

    // Update progress steps
    function updateProgressSteps(currentStep) {
        const steps = [document.querySelector('.step-item.active'), step2, step3];
        
        steps.forEach((step, index) => {
            if (step) {
                if (index < currentStep) {
                    step.classList.add('active');
                } else {
                    step.classList.remove('active');
                }
            }
        });
    }

    // Form validation
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function validateDonationForm(form) {
        let isValid = true;
        
        // Validate basic form fields
        const basicInputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        basicInputs.forEach(input => {
            const value = input.value.trim();
            
            // Remove previous validation classes
            input.classList.remove('is-valid', 'is-invalid');
            
            if (value === '') {
                input.classList.add('is-invalid');
                isValid = false;
            } else if (input.type === 'email' && !validateEmail(value)) {
                input.classList.add('is-invalid');
                isValid = false;
            } else {
                input.classList.add('is-valid');
            }
        });
        
        // Validate dynamic form fields
        const dynamicInputs = dynamicFormContent.querySelectorAll('input[required], select[required], textarea[required]');
        dynamicInputs.forEach(input => {
            const value = input.value.trim();
            
            // Remove previous validation classes
            input.classList.remove('is-valid', 'is-invalid');
            
            if (value === '') {
                input.classList.add('is-invalid');
                isValid = false;
            } else {
                input.classList.add('is-valid');
            }
        });

        // Validate checkboxes
        const checkboxes = form.querySelectorAll('input[type="checkbox"][required]');
        checkboxes.forEach(checkbox => {
            if (!checkbox.checked) {
                checkbox.classList.add('is-invalid');
                isValid = false;
            } else {
                checkbox.classList.remove('is-invalid');
            }
        });
        
        return isValid;
    }

    // Collect dynamic fields data
    function collectDynamicFields() {
        const dynamicFields = {};
        const dynamicInputs = dynamicFormContent.querySelectorAll('input, select, textarea');
        
        dynamicInputs.forEach(input => {
            if (input.id && !input.classList.contains('document-upload')) {
                dynamicFields[input.id] = input.value;
            }
        });
        
        return dynamicFields;
    }

    // Donation request form submission handler
    donationRequestForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Form submitted');
        
        if (validateDonationForm(this)) {
            console.log('Form validation passed');
            updateProgressSteps(3);
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            // Collect form data
            const requestData = {
                requestType: document.getElementById('requestType').value,
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                idNumber: document.getElementById('idNumber').value,
                phoneNumber: document.getElementById('phoneNumber').value,
                email: document.getElementById('email').value,
                city: document.getElementById('city').value,
                urgencyLevel: document.getElementById('urgencyLevel').value,
                additionalNotes: document.getElementById('additionalNotes').value || '',
                dynamicFields: collectDynamicFields()
            };
            
            // Show loading state
            submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm ms-2"></span>جاري تقديم الطلب...`;
            submitBtn.disabled = true;
            
            try {
                // Make API call
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // Show success message
                    successMessage.textContent = messages.success.donationRequest.replace('{email}', requestData.email);
                    successModal.show();
                    
                    // Clear form
                    this.reset();
                    dynamicFormSection.classList.add('d-none');
                    dynamicFormContent.innerHTML = '';
                    updateProgressSteps(1);
                    
                    // Redirect to main page after modal is closed
                    successModal._element.addEventListener('hidden.bs.modal', function() {
                        window.location.href = 'HomePage.html';
                    }, { once: true });
                } else {
                    // Handle error response
                    let errorMessage = 'حدث خطأ أثناء تقديم الطلب. يرجى المحاولة مرة أخرى.';
                    
                    if (data.errors && data.errors.length > 0) {
                        errorMessage = data.errors.map(err => err.msg).join(', ');
                    } else if (data.message) {
                        errorMessage = data.message;
                    }
                    
                    alert(errorMessage);
                }
            } catch (error) {
                console.error('Donation request error:', error);
                alert('حدث خطأ في الاتصال بالخادم. يرجى التأكد من تشغيل السيرفر والمحاولة مرة أخرى.');
            } finally {
                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    });

    // Real-time validation for better UX
    document.addEventListener('input', function(e) {
        if (e.target.matches('input, select, textarea')) {
            // Remove invalid class when user starts typing
            if (e.target.classList.contains('is-invalid')) {
                e.target.classList.remove('is-invalid');
            }
        }
    });

    // RTL-specific enhancements
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            // Ensure cursor starts at the right position for RTL
            setTimeout(() => {
                if (this.value === '') {
                    this.style.textAlign = 'right';
                }
            }, 10);
        });
        
        input.addEventListener('input', function() {
            // Maintain RTL alignment while typing
            this.style.textAlign = 'right';
        });
    });

    // Initialize tooltips if Bootstrap tooltips are available
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function(tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
});
