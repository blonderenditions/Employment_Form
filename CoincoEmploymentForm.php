<?PHP
/*
Simfatic Forms Main Form processor script

This script does all the server side processing. 
(Displaying the form, processing form submissions,
displaying errors, making CAPTCHA image, and so on.) 

All pages (including the form page) are displayed using 
templates in the 'templ' sub folder. 

The overall structure is that of a list of modules. Depending on the 
arguments (POST/GET) passed to the script, the modules process in sequence. 

Please note that just appending  a header and footer to this script won't work.
To embed the form, use the 'Copy & Paste' code in the 'Take the Code' page. 
To extend the functionality, see 'Extension Modules' in the help.

*/

@ini_set("display_errors", 1);//the error handler is added later in FormProc
error_reporting(E_ALL);

require_once(dirname(__FILE__)."/includes/CoincoEmploymentForm-lib.php");
$formproc_obj =  new SFM_FormProcessor('CoincoEmploymentForm');
$formproc_obj->initTimeZone('default');
$formproc_obj->setFormID('bcd65123-4849-40bb-8590-37fdb72a0b41');
$formproc_obj->setFormKey('da3d4091-27ff-47a9-888e-d67c4134aa81');
$formproc_obj->setLocale('en-US','M/d/yyyy');
$formproc_obj->setEmailFormatHTML(true);
$formproc_obj->EnableLogging(false);
$formproc_obj->SetDebugMode(false);
$formproc_obj->setIsInstalled(true);
$formproc_obj->SetPrintPreviewPage(sfm_readfile(dirname(__FILE__)."/templ/CoincoEmploymentForm_print_preview_file.txt"));
$formproc_obj->SetSingleBoxErrorDisplay(true);
$formproc_obj->setFormPage(0,sfm_readfile(dirname(__FILE__)."/templ/CoincoEmploymentForm_form_page_0.txt"));
$formproc_obj->AddElementInfo('Name','text','');
$formproc_obj->AddElementInfo('Title','text','');
$formproc_obj->AddElementInfo('Email','email','');
$formproc_obj->AddElementInfo('Phone','telephone','');
$formproc_obj->AddElementInfo('Comments_Opportunities','multiline','');
$formproc_obj->AddElementInfo('upload','upload_ex','');
$formproc_obj->AddDefaultValue('Name','Name');
$formproc_obj->AddDefaultValue('Title','Title');
$formproc_obj->AddDefaultValue('Comments_Opportunities','Comments or Opportunities you are looking for.');
$formproc_obj->setIsInstalled(true);
$formproc_obj->setFormFileFolder('./formdata');
$formproc_obj->SetHiddenInputTrapVarName('t5d42cb601c691fbead8f');
$formproc_obj->SetFromAddress('Coinco <info@coincoinc.com>');
$sfm_captcha =  new FM_CaptchaCreator('Captcha');
$sfm_captcha->SetSize(150,60);
$sfm_captcha->SetCharset('2356789ABCDEFGHJKLMNPQRSTUVWXYZ');
$sfm_captcha->SetCaseInsensitiveMatch(true);
$sfm_captcha->SetNChars(6);
$sfm_captcha->SetNLines(4);
$sfm_captcha->SetFontFile('images/SFOldRepublicBold.ttf');
$sfm_captcha->SetErrorStrings('Please input the code displayed in the image','The code does not match. Please try again.');
$formproc_obj->addModule($sfm_captcha);

$page_renderer =  new FM_FormPageDisplayModule();
$formproc_obj->addModule($page_renderer);

$validator =  new FM_FormValidator();
$validator->addValidation("Name","required","Please fill in Name");
$validator->addValidation("Email","email","The input for  should be a valid email value");
$validator->addValidation("Email","required","Please fill in Email");
$validator->addValidation("upload","max_numfiles=2","You can upload only 2 files for this field");
$validator->addValidation("upload","max_filesize=2048","The file size should be less than 2 MB");
$validator->addValidation("upload","file_extn=jpg; gif; png; pdf","Allowed files types are: jpg; gif; png; pdf");
$formproc_obj->addModule($validator);

$upld =  new FM_FileUploadHandler();
$upld->SetFileUploadFields(array('upload'));
$formproc_obj->addModule($upld);

$data_email_sender =  new FM_FormDataSender(sfm_readfile(dirname(__FILE__)."/templ/CoincoEmploymentForm_email_subj.txt"),sfm_readfile(dirname(__FILE__)."/templ/CoincoEmploymentForm_email_body.txt"),'%Email%');
$data_email_sender->AddToAddr('Sharon <sharon@blonderenditions.com>');
$data_email_sender->SetAttachFiles(true);
$formproc_obj->addModule($data_email_sender);

$tupage =  new FM_ThankYouPage();
$tupage->SetRedirURL('https://www.coincoinc.com');
$formproc_obj->addModule($tupage);

$validator->SetFileUploader($upld);
$thumbnail =  new FM_ThumbnailModule();
$formproc_obj->AddExtensionModule($thumbnail);
$data_email_sender->SetFileUploader($upld);
$sfm_captcha->SetValidator($validator);
$page_renderer->SetFormValidator($validator);
$page_renderer->SetFileUploader($upld);
$formproc_obj->ProcessForm();

?>