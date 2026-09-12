/*
 * T-Choob product type registry
 *
 * برای اضافه کردن نوع محصول جدید، فقط یک مورد جدید داخل TCHOO_PRODUCT_TYPES
 * اضافه کن. فرم‌های ادمین، سفارش مشتری، فیلتر فروشگاه و تولید کد از همین فایل استفاده می‌کنند.
 */

window.TCHOO_PRODUCT_TYPES = {
    JK: {
        name: 'جاکلیدی',
        fields: [
            { key: 'wood', label: 'چوب', type: 'select', options: ['گردو', 'عناب', 'کرات', 'نارنج', 'گردو سوخته', 'سنجد', 'متفرقه'], filter: true, filterLabel: 'همه چوب‌ها' },
            { key: 'hook_count', label: 'تعداد قلاب', type: 'number', filter: true, placeholder: 'تعداد قلاب' },
            { key: 'width', label: 'عرض', type: 'number', filter: true, placeholder: 'عرض' },
            { key: 'length', label: 'طول', type: 'number', filter: true, placeholder: 'طول' },
            { key: 'design', label: 'طرح', type: 'text', placeholder: 'URL تصاویر طرح', full: true }
        ]
    },

    JS: {
        name: 'جاسوئیچی',
        fields: [
            { key: 'wood', label: 'چوب', type: 'select', options: ['گردو', 'عناب', 'کرات', 'نارنج', 'گردو سوخته', 'سنجد', 'متفرقه'], filter: true, filterLabel: 'همه چوب‌ها' },
            { key: 'size', label: 'اندازه', type: 'select', options: ['کوچک', 'متوسط', 'بزرگ'], filter: true, filterLabel: 'همه اندازه‌ها' },
            { key: 'design', label: 'طرح', type: 'text', placeholder: 'URL تصویر یا نام طرح' },
            { key: 'font', label: 'فونت', type: 'select', options: ['ندارد', '1', '2', '3', '4'], filter: true, filterLabel: 'همه فونت‌ها' }
        ]
    },

    TB: {
        name: 'تابلو',
        fields: [
            { key: 'design', label: 'طرح', type: 'text', placeholder: 'URL تصاویر طرح', full: true },
            { key: 'width', label: 'عرض', type: 'number', filter: true, placeholder: 'عرض' },
            { key: 'length', label: 'طول', type: 'number', filter: true, placeholder: 'طول' }
        ]
    },

    CL: {
        name: 'ساعت',
        fields: [
            { key: 'design', label: 'طرح', type: 'text', placeholder: 'URL تصاویر طرح', full: true },
            { key: 'width', label: 'عرض', type: 'number', filter: true, placeholder: 'عرض' },
            { key: 'length', label: 'طول', type: 'number', filter: true, placeholder: 'طول' }
        ]
    },

    OT: {
        name: 'غیره',
        fields: [
            { key: 'product_name', label: 'نام محصول', type: 'text', placeholder: 'نام محصول', full: true },
            { key: 'design', label: 'طرح', type: 'text', placeholder: 'URL تصاویر طرح', full: true }
        ]
    }
};

window.TCHOO_PRODUCT_TYPES_LIST = Object.entries(window.TCHOO_PRODUCT_TYPES);
