/**
 * Google Apps Script - Business Logic & Database Controller
 * IEEEXtreme 20.0 – Gaza Operations Management System
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'createOrder') {
      return ContentService.createTextOutput(JSON.stringify(createOrderProcess(data)))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Unknown Action' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function createOrderProcess(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const lock = LockService.getScriptLock();
  
  // Acquire lock to prevent concurrency conflicts and negative stock
  try {
    lock.waitLock(10000);
  } catch (e) {
    return { success: false, error: 'الخادم مشغول حالياً، يرجى إعادة المحاولة.' };
  }
  
  try {
    const ordersSheet = ss.getSheetByName('طلبات البوفية');
    const orderId = 'ORD-' + new Date().getTime().toString().slice(-4);
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Gaza', 'yyyy-MM-dd HH:mm:ss');
    
    ordersSheet.appendRow([orderId, data.userId, timestamp, 'في الانتظار', 0]);
    
    lock.releaseLock();
    return {
      success: true,
      orderId: orderId,
      status: 'في الانتظار',
      queuePosition: ordersSheet.getLastRow() - 1,
      estimatedMinutes: 6
    };
  } catch (err) {
    lock.releaseLock();
    throw err;
  }
}

/**
 * Automated Setup function to create all Arabic-named Google Sheets sheets and headers.
 */
function SetupSystemSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetsConfig = {
    'المستخدمون': ['معرّف المستخدم', 'الاسم الكامل', 'اسم المستخدم', 'كلمة المرور', 'الدور', 'رقم الفريق', 'حالة الحساب', 'رقم الهاتف', 'تاريخ الإنشاء'],
    'أدوار المستخدمين': ['معرّف المستخدم', 'الدور الإضافي'],
    'الفرق': ['رقم الفريق', 'اسم الفريق', 'عدد الأعضاء', 'حالة الفريق', 'مكان الجلوس'],
    'طلبات البوفية': ['رقم الطلب', 'اسم المستخدم', 'وقت الطلب', 'الحالة', 'عدد الطلبات التي تسبقه'],
    'أصناف الضيافة': ['معرّف الصنف', 'اسم الصنف', 'الفئة', 'وحدة القياس', 'الحصة الافتراضية', 'متوفر'],
    'أرصدة المخزون': ['معرّف الصنف', 'اسم الصنف', 'المخزن المركزي', 'مخزون البوفية', 'الحد الأدنى'],
    'البلاغات والتذاكر': ['رقم التذكرة', 'صاحب التذكرة', 'القسم', 'العنوان', 'الوصف', 'الأولوية', 'الحالة', 'وقت الإنشاء'],
    'سجل العمليات': ['اسم المستخدم', 'نوع العملية', 'القسم', 'الوقت', 'نتيجة العملية'],
    'إعدادات النظام': ['المفتاح', 'القيمة']
  };

  for (let sheetName in sheetsConfig) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(sheetsConfig[sheetName]);
      sheet.getRange(1, 1, 1, sheetsConfig[sheetName].length).setBackground('#00629B').setFontColor('#FFFFFF').setFontWeight('bold');
    }
  }
}