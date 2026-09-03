export const ADMIN_DOCS_VERSION = "1.0.0";

export const ADMIN_DOCS_UPDATED_AT = "2026-09-03";

export const ADMIN_DOCS = [
  {
    id: "getting-started",

    icon: "rocket",

    title: {
      en: "Getting Started",
      th: "เริ่มต้นใช้งาน",
    },

    description: {
      en: "Prepare the company workspace before creating and publishing website content.",
      th: "เตรียมพื้นที่ทำงานของบริษัทก่อนสร้างและเผยแพร่เนื้อหาบนเว็บไซต์",
    },

    steps: {
      en: [
        "Sign in to the Admin system using your assigned account.",
        "Select the company you want to manage from the company switcher.",
        "Open Settings and confirm the website languages.",
        "Complete the Company Profile, branding, contact details and social links.",
        "Configure Privacy and publish the required legal documents.",
        "Upload reusable images to the Media Library.",
        "Review the website menu before publishing content.",
      ],

      th: [
        "เข้าสู่ระบบ Admin ด้วยบัญชีที่ได้รับมอบหมาย",
        "เลือกบริษัทที่ต้องการจัดการจากเมนูสลับบริษัท",
        "เปิด Settings และตรวจสอบภาษาที่ใช้บนเว็บไซต์",
        "กรอกข้อมูลบริษัท Branding ข้อมูลติดต่อ และ Social Media ให้ครบ",
        "ตั้งค่า Privacy และเผยแพร่เอกสารทางกฎหมายที่จำเป็น",
        "อัปโหลดรูปที่ต้องใช้ซ้ำไว้ใน Media Library",
        "ตรวจสอบเมนูเว็บไซต์ก่อนเผยแพร่เนื้อหา",
      ],
    },

    notes: {
      en: [
        "English is the default content language.",
        "Thai fields appear only when Thai is enabled in Localization.",
        "Always verify the selected company before editing or publishing content.",
      ],

      th: [
        "ภาษาอังกฤษเป็นภาษาเริ่มต้นของเนื้อหา",
        "ช่องภาษาไทยจะแสดงเมื่อเปิดภาษาไทยใน Localization เท่านั้น",
        "ตรวจสอบบริษัทที่เลือกทุกครั้งก่อนแก้ไขหรือเผยแพร่ข้อมูล",
      ],
    },
  },

  {
    id: "dashboard",

    icon: "layout-dashboard",

    title: {
      en: "Dashboard",
      th: "แดชบอร์ด",
    },

    description: {
      en: "Review website activity, content performance, form messages and recent system activity.",
      th: "ตรวจสอบกิจกรรมเว็บไซต์ ประสิทธิภาพเนื้อหา ข้อความจากฟอร์ม และกิจกรรมล่าสุด",
    },

    steps: {
      en: [
        "Select a reporting range from the Dashboard range selector.",
        "Review total views, unique visitors, likes, shares and notifications.",
        "Use Website Traffic to compare views and unique visitors over time.",
        "Review Message Summary for Contact, Survey, Career and Custom forms.",
        "Use Top Content to identify the most visited or engaged content.",
        "Open Recent Activity to review the latest website and Admin events.",
        "Use View Website to open the selected company website.",
      ],

      th: [
        "เลือกช่วงเวลารายงานจากตัวเลือกบน Dashboard",
        "ตรวจสอบยอดเข้าชม ผู้ชมที่ไม่ซ้ำ การกดถูกใจ การแชร์ และการแจ้งเตือน",
        "ดู Website Traffic เพื่อเปรียบเทียบยอดเข้าชมกับผู้ชมที่ไม่ซ้ำตามช่วงเวลา",
        "ดู Message Summary สำหรับ Contact, Survey, Career และ Custom form",
        "ใช้ Top Content เพื่อตรวจสอบเนื้อหาที่ได้รับความสนใจสูงสุด",
        "เปิด Recent Activity เพื่อตรวจสอบกิจกรรมล่าสุดของเว็บไซต์และ Admin",
        "ใช้ View Website เพื่อเปิดเว็บไซต์ของบริษัทที่เลือก",
      ],
    },

    notes: {
      en: [
        "Analytics figures may require visitor Analytics consent.",
        "The selected reporting range affects traffic and summary data.",
      ],

      th: [
        "ข้อมูล Analytics บางส่วนจะแสดงเมื่อผู้เข้าชมยินยอม Analytics",
        "ช่วงเวลาที่เลือกมีผลต่อข้อมูล Traffic และข้อมูลสรุป",
      ],
    },
  },

  {
    id: "company",

    icon: "building",

    title: {
      en: "Company Profile",
      th: "ข้อมูลบริษัท",
    },

    description: {
      en: "Manage company identity, contact information, branding, theme, social links and global SEO.",
      th: "จัดการข้อมูลบริษัท ช่องทางติดต่อ Branding ธีม Social Media และ Global SEO",
    },

    steps: {
      en: [
        "Open Company and verify the selected company.",
        "Complete the company name, legal name and short name.",
        "Enter registration, tax, address and contact information where applicable.",
        "Configure the company logo and website branding.",
        "Review Light and Dark theme colors using the preview.",
        "Enter only official company social media URLs.",
        "Review the generated global SEO information.",
        "Save and refresh the page to confirm the data persists.",
      ],

      th: [
        "เปิด Company และตรวจสอบบริษัทที่กำลังเลือก",
        "กรอกชื่อบริษัท ชื่อทางกฎหมาย และชื่อย่อ",
        "กรอกข้อมูลจดทะเบียน ภาษี ที่อยู่ และข้อมูลติดต่อเท่าที่เกี่ยวข้อง",
        "ตั้งค่าโลโก้และ Branding ของเว็บไซต์",
        "ตรวจสอบสี Light และ Dark theme ผ่านส่วน Preview",
        "กรอกเฉพาะ URL Social Media อย่างเป็นทางการของบริษัท",
        "ตรวจสอบข้อมูล Global SEO ที่ระบบสร้างให้",
        "บันทึกและ Refresh หน้าเพื่อตรวจสอบว่าข้อมูลยังอยู่ครบ",
      ],
    },

    notes: {
      en: [
        "Changing branding or theme colors affects the selected company website.",
        "Company slug and status may be restricted to Superadmin.",
      ],

      th: [
        "การเปลี่ยน Branding หรือสี Theme จะส่งผลกับเว็บไซต์ของบริษัทที่เลือก",
        "การแก้ Company slug และ status อาจจำกัดเฉพาะ Superadmin",
      ],
    },
  },

  {
    id: "home",

    icon: "home",

    title: {
      en: "Home Page",
      th: "หน้า Home",
    },

    description: {
      en: "Manage the homepage slideshow, ordering and public visibility.",
      th: "จัดการ Slideshow หน้าแรก ลำดับการแสดง และสถานะเผยแพร่",
    },

    steps: {
      en: [
        "Open Home from the Content section.",
        "Add or select slideshow images from the Media Library.",
        "Enter localized titles, descriptions or links when required.",
        "Arrange slideshow items in the required order.",
        "Save the changes before leaving the page.",
        "Open the public website and verify desktop and mobile presentation.",
      ],

      th: [
        "เปิด Home จากกลุ่ม Content",
        "เพิ่มหรือเลือกรูป Slideshow จาก Media Library",
        "กรอกชื่อ คำอธิบาย หรือลิงก์ตามภาษาที่เปิดใช้งาน",
        "จัดเรียงรายการ Slideshow ตามลำดับที่ต้องการ",
        "บันทึกการเปลี่ยนแปลงก่อนออกจากหน้า",
        "เปิดเว็บไซต์จริงเพื่อตรวจสอบการแสดงผลบน Desktop และมือถือ",
      ],
    },

    notes: {
      en: [
        "Use optimized landscape images with consistent dimensions.",
        "Do not upload copyrighted images without permission.",
      ],

      th: [
        "ควรใช้รูปแนวนอนที่ปรับขนาดแล้วและมีสัดส่วนสม่ำเสมอ",
        "ห้ามอัปโหลดรูปที่มีลิขสิทธิ์โดยไม่ได้รับอนุญาต",
      ],
    },
  },

  {
    id: "about",

    icon: "info",

    title: {
      en: "About Page",
      th: "หน้า About",
    },

    description: {
      en: "Manage the company introduction, profile sections, cover image and SEO.",
      th: "จัดการข้อมูลแนะนำบริษัท เนื้อหา รูป Cover และ SEO",
    },

    steps: {
      en: [
        "Open About and select the supported content language.",
        "Enter the page title, excerpt and main content.",
        "Select an appropriate cover image from the Media Library.",
        "Complete additional sections when they are required by the layout.",
        "Review the automatically generated SEO values.",
        "Save the draft and preview the page.",
        "Publish only after all visible content has been reviewed.",
      ],

      th: [
        "เปิด About และเลือกภาษาของเนื้อหาที่ต้องการกรอก",
        "กรอกชื่อหน้า ข้อความสรุป และเนื้อหาหลัก",
        "เลือกรูป Cover ที่เหมาะสมจาก Media Library",
        "กรอก Section เพิ่มเติมตามที่ Layout ต้องใช้งาน",
        "ตรวจสอบค่า SEO ที่ระบบสร้างให้อัตโนมัติ",
        "บันทึก Draft และตรวจสอบ Preview",
        "เผยแพร่เมื่อทบทวนเนื้อหาที่แสดงทั้งหมดแล้วเท่านั้น",
      ],
    },

    notes: {
      en: [
        "Saving does not necessarily publish the page.",
        "Manual SEO changes are preserved when the source title changes.",
      ],

      th: [
        "การ Save ไม่ได้หมายความว่าหน้าจะถูก Publish เสมอไป",
        "ค่า SEO ที่ผู้ใช้แก้เองจะไม่ถูกชื่อเนื้อหาใหม่เขียนทับ",
      ],
    },
  },

  {
    id: "projects",

    icon: "folder",

    title: {
      en: "Projects",
      th: "โครงการ",
    },

    description: {
      en: "Create and maintain architecture, interior design, construction and related project portfolios.",
      th: "สร้างและจัดการผลงานด้านสถาปัตยกรรม ออกแบบภายใน ก่อสร้าง และงานที่เกี่ยวข้อง",
    },

    steps: {
      en: [
        "Open Projects and select Add Project.",
        "Choose the project type and category.",
        "Enter the project title and available localized content.",
        "Complete project facts such as location, year, area and client where appropriate.",
        "Select a cover image and add gallery images.",
        "Arrange gallery images in the intended display order.",
        "Add relevant tags for organization and SEO.",
        "Review SEO Title, Keywords, Open Graph Title and Open Graph Image.",
        "Save the project before publishing it.",
        "Open the project on the public website and verify the slideshow and details.",
      ],

      th: [
        "เปิด Projects แล้วเลือก Add Project",
        "เลือกประเภทและหมวดหมู่ของโครงการ",
        "กรอกชื่อโครงการและเนื้อหาตามภาษาที่เปิดใช้งาน",
        "กรอกข้อมูลโครงการ เช่น สถานที่ ปี พื้นที่ และลูกค้าเท่าที่เหมาะสม",
        "เลือก Cover image และเพิ่มรูป Gallery",
        "จัดลำดับรูป Gallery ตามลำดับที่ต้องการแสดง",
        "เพิ่ม Tag ที่เกี่ยวข้องเพื่อใช้จัดหมวดหมู่และ SEO",
        "ตรวจสอบ SEO Title, Keywords, Open Graph Title และ Open Graph Image",
        "บันทึกโครงการก่อน Publish",
        "เปิดโครงการบนเว็บไซต์จริงและตรวจสอบ Slideshow กับรายละเอียด",
      ],
    },

    notes: {
      en: [
        "The cover image is used automatically as the Open Graph image until manually changed.",
        "Only publish complete projects with approved images and information.",
      ],

      th: [
        "ระบบจะใช้ Cover image เป็น Open Graph image จนกว่าผู้ใช้จะเปลี่ยนเอง",
        "ควร Publish เฉพาะโครงการที่ข้อมูลและรูปได้รับการอนุมัติแล้ว",
      ],
    },
  },

  {
    id: "awards",

    icon: "award",

    title: {
      en: "Awards",
      th: "รางวัล",
    },

    description: {
      en: "Create award records and connect them to the company portfolio.",
      th: "สร้างข้อมูลรางวัลและเชื่อมโยงกับผลงานของบริษัท",
    },

    steps: {
      en: [
        "Open Awards and select Add Award.",
        "Enter the award title, organization and award year.",
        "Add localized descriptions and supporting information.",
        "Select a cover image or official award image.",
        "Connect related projects when applicable.",
        "Review the generated SEO values.",
        "Save and publish after confirming the official award information.",
      ],

      th: [
        "เปิด Awards แล้วเลือก Add Award",
        "กรอกชื่อรางวัล องค์กรผู้มอบ และปีที่ได้รับรางวัล",
        "เพิ่มคำอธิบายและข้อมูลประกอบตามภาษา",
        "เลือก Cover image หรือรูปอย่างเป็นทางการของรางวัล",
        "เชื่อมโยงโครงการที่เกี่ยวข้องถ้ามี",
        "ตรวจสอบค่า SEO ที่ระบบสร้างให้",
        "บันทึกและ Publish หลังตรวจสอบข้อมูลรางวัลอย่างเป็นทางการ",
      ],
    },

    notes: {
      en: [
        "Use the award organization's official name.",
        "Confirm permission before reproducing third-party logos or award artwork.",
      ],

      th: [
        "ควรใช้ชื่อทางการขององค์กรผู้มอบรางวัล",
        "ตรวจสอบสิทธิ์ก่อนนำโลโก้หรือ Artwork ขององค์กรอื่นมาใช้งาน",
      ],
    },
  },

  {
    id: "public-content",

    icon: "newspaper",

    title: {
      en: "Public Content",
      th: "Public Content",
    },

    description: {
      en: "Manage publications, articles, videos and supported external media.",
      th: "จัดการ Publication บทความ วิดีโอ และสื่อภายนอกที่ระบบรองรับ",
    },

    steps: {
      en: [
        "Open Public Content and select Add Content.",
        "Choose Article, Video or Embed as the content type.",
        "Enter the title, excerpt and content for supported languages.",
        "For external media, provide the original public URL and confirm the provider.",
        "Select a cover image when the content requires one.",
        "Review tags and generated SEO information.",
        "Save, preview and publish the content.",
      ],

      th: [
        "เปิด Public Content แล้วเลือก Add Content",
        "เลือกประเภท Article, Video หรือ Embed",
        "กรอกชื่อ Excerpt และเนื้อหาตามภาษาที่เปิดใช้งาน",
        "สำหรับสื่อภายนอก ให้ใส่ URL ต้นฉบับและตรวจสอบ Provider",
        "เลือก Cover image เมื่อเนื้อหาประเภทนั้นต้องใช้งาน",
        "ตรวจสอบ Tag และข้อมูล SEO ที่ระบบสร้างให้",
        "บันทึก Preview และ Publish เนื้อหา",
      ],
    },

    notes: {
      en: [
        "Only embed content from trusted and authorized sources.",
        "External content may stop working when the provider removes or restricts it.",
      ],

      th: [
        "ควร Embed เฉพาะเนื้อหาจากแหล่งที่เชื่อถือได้และได้รับอนุญาต",
        "สื่อภายนอกอาจหยุดแสดงเมื่อ Provider ลบหรือจำกัดการเข้าถึง",
      ],
    },
  },

  {
    id: "news",

    icon: "file-text",

    title: {
      en: "News",
      th: "ข่าวสาร",
    },

    description: {
      en: "Create announcements, company news and time-sensitive updates.",
      th: "สร้างประกาศ ข่าวบริษัท และข้อมูลอัปเดตตามช่วงเวลา",
    },

    steps: {
      en: [
        "Open News and select Add News.",
        "Enter the title, excerpt and article content.",
        "Select the publication date and cover image.",
        "Add relevant tags.",
        "Review the generated SEO information.",
        "Save, preview and publish the news item.",
        "Unpublish or archive outdated information when appropriate.",
      ],

      th: [
        "เปิด News แล้วเลือก Add News",
        "กรอกชื่อ Excerpt และเนื้อหาข่าว",
        "เลือกวันที่เผยแพร่และ Cover image",
        "เพิ่ม Tag ที่เกี่ยวข้อง",
        "ตรวจสอบข้อมูล SEO ที่ระบบสร้างให้",
        "บันทึก Preview และ Publish ข่าว",
        "Unpublish หรือ Archive ข้อมูลที่หมดอายุตามความเหมาะสม",
      ],
    },

    notes: {
      en: [
        "Verify dates, names and external links before publishing.",
        "Do not publish personal or confidential information without authorization.",
      ],

      th: [
        "ตรวจสอบวันที่ ชื่อบุคคล และลิงก์ภายนอกก่อน Publish",
        "ห้ามเผยแพร่ข้อมูลส่วนบุคคลหรือข้อมูลลับโดยไม่ได้รับอนุญาต",
      ],
    },
  },

  {
    id: "contact",

    icon: "contact",

    title: {
      en: "Contact Page",
      th: "หน้า Contact",
    },

    description: {
      en: "Manage public contact information, location details and the contact form.",
      th: "จัดการข้อมูลติดต่อ ที่ตั้ง และแบบฟอร์มติดต่อบนเว็บไซต์",
    },

    steps: {
      en: [
        "Open Contact and complete the localized page information.",
        "Verify the address, telephone, email and map URL.",
        "Review the contact form fields.",
        "Ensure required fields are clearly marked.",
        "Confirm that Privacy consent is available when personal data is collected.",
        "Submit a test message from the public website.",
        "Verify that the message appears in Admin Messages.",
      ],

      th: [
        "เปิด Contact และกรอกข้อมูลหน้าตามภาษาที่เปิดใช้งาน",
        "ตรวจสอบที่อยู่ โทรศัพท์ อีเมล และ Map URL",
        "ตรวจสอบช่องข้อมูลในแบบฟอร์มติดต่อ",
        "ตรวจสอบว่าช่องบังคับกรอกมีเครื่องหมายชัดเจน",
        "ตรวจสอบว่ามี Privacy consent เมื่อแบบฟอร์มเก็บข้อมูลส่วนบุคคล",
        "ทดลองส่งข้อความจากเว็บไซต์จริง",
        "ตรวจสอบว่าข้อความปรากฏใน Admin Messages",
      ],
    },

    notes: {
      en: [
        "Use a monitored company email address.",
        "Collect only information necessary for responding to the inquiry.",
      ],

      th: [
        "ควรใช้อีเมลบริษัทที่มีผู้ตรวจสอบเป็นประจำ",
        "เก็บเฉพาะข้อมูลที่จำเป็นต่อการตอบคำถามหรือให้บริการ",
      ],
    },
  },

  {
    id: "messages",

    icon: "mail",

    title: {
      en: "Messages",
      th: "ข้อความ",
    },

    description: {
      en: "Review and manage form submissions received from the public website.",
      th: "ตรวจสอบและจัดการข้อมูลที่ได้รับจากแบบฟอร์มบนเว็บไซต์",
    },

    steps: {
      en: [
        "Open Messages from the Management section.",
        "Use status and form filters to locate submissions.",
        "Open a message to review the submitted information and attachments.",
        "Update the message status according to the internal workflow.",
        "Download attachments only when required for authorized work.",
        "Delete or retain records according to the configured retention policy.",
      ],

      th: [
        "เปิด Messages จากกลุ่ม Management",
        "ใช้ตัวกรองสถานะและประเภท Form เพื่อค้นหาข้อความ",
        "เปิดข้อความเพื่อตรวจสอบข้อมูลและไฟล์แนบ",
        "เปลี่ยนสถานะข้อความตามกระบวนการทำงานภายใน",
        "ดาวน์โหลดไฟล์แนบเมื่อจำเป็นต่อการทำงานที่ได้รับอนุญาตเท่านั้น",
        "ลบหรือเก็บข้อมูลตามระยะเวลา Retention ที่ตั้งไว้",
      ],
    },

    notes: {
      en: [
        "Messages may contain personal data and must be accessed only by authorized users.",
        "Do not forward submissions or attachments through unsecured channels.",
      ],

      th: [
        "ข้อความอาจมีข้อมูลส่วนบุคคลและต้องเข้าถึงโดยผู้ได้รับอนุญาตเท่านั้น",
        "ห้ามส่งต่อข้อมูลหรือไฟล์แนบผ่านช่องทางที่ไม่ปลอดภัย",
      ],
    },
  },

  {
    id: "media",

    icon: "image",

    title: {
      en: "Media Library",
      th: "คลังสื่อ",
    },

    description: {
      en: "Upload, organize and reuse approved website images.",
      th: "อัปโหลด จัดระเบียบ และนำรูปที่ได้รับอนุมัติกลับมาใช้ในเว็บไซต์",
    },

    steps: {
      en: [
        "Open Media from the Management section.",
        "Upload images by selecting files or using the upload dropzone.",
        "Wait until every item reports a completed upload.",
        "Add meaningful alternative text and metadata where supported.",
        "Select existing media from editors instead of uploading duplicate files.",
        "Remove unused media only after confirming it is not used by published content.",
      ],

      th: [
        "เปิด Media จากกลุ่ม Management",
        "อัปโหลดรูปด้วยการเลือกไฟล์หรือวางไฟล์ใน Upload dropzone",
        "รอจนทุกรายการแสดงว่าอัปโหลดเสร็จ",
        "เพิ่ม Alternative text และ Metadata ที่สื่อความหมายเมื่อระบบรองรับ",
        "เลือก Media เดิมจาก Editor แทนการอัปโหลดไฟล์ซ้ำ",
        "ลบ Media ที่ไม่ใช้หลังตรวจสอบว่าไม่ได้อยู่ในเนื้อหาที่ Publish แล้ว",
      ],
    },

    notes: {
      en: [
        "Do not close the picker or select an image while a batch upload is still running.",
        "Upload only company-owned, licensed or otherwise authorized media.",
        "Copying, modifying or redistributing protected images without permission is prohibited.",
      ],

      th: [
        "อย่าปิด Media Picker หรือเลือกรูประหว่างที่ Batch upload ยังทำงาน",
        "อัปโหลดเฉพาะสื่อที่บริษัทเป็นเจ้าของ มี License หรือได้รับอนุญาต",
        "ห้ามคัดลอก ดัดแปลง หรือเผยแพร่รูปที่มีลิขสิทธิ์โดยไม่ได้รับอนุญาต",
      ],
    },
  },

  {
    id: "navigation",

    icon: "menu",

    title: {
      en: "Menu Management",
      th: "จัดการเมนู",
    },

    description: {
      en: "Control public navigation labels, links, ordering, visibility and submenu relationships.",
      th: "ควบคุมชื่อ ลิงก์ ลำดับ การมองเห็น และความสัมพันธ์ของ Submenu",
    },

    steps: {
      en: [
        "Open Menu Management.",
        "Review the menu for the currently selected company.",
        "Add a menu item and select its destination type.",
        "Enter menu labels for every enabled website language.",
        "Drag menu items to change their order.",
        "Move supported items under a parent to create a submenu.",
        "Disable items that should temporarily disappear from the public website.",
        "Save and verify both desktop and mobile public menus.",
      ],

      th: [
        "เปิด Menu Management",
        "ตรวจสอบเมนูของบริษัทที่กำลังเลือก",
        "เพิ่มเมนูและเลือกประเภทปลายทาง",
        "กรอกชื่อเมนูให้ครบทุกภาษาที่เปิดใช้บนเว็บไซต์",
        "ลากเมนูเพื่อเปลี่ยนลำดับ",
        "ย้ายรายการที่รองรับไว้ใต้ Parent เพื่อสร้าง Submenu",
        "ปิดรายการที่ต้องการซ่อนจากเว็บไซต์ชั่วคราว",
        "บันทึกและตรวจสอบเมนู Public ทั้ง Desktop และมือถือ",
      ],
    },

    notes: {
      en: [
        "Do not link to draft or unpublished content.",
        "Keep menu labels short and consistent.",
      ],

      th: [
        "ห้ามเชื่อมเมนูไปยังเนื้อหาที่ยังเป็น Draft หรือยังไม่ Publish",
        "ควรใช้ชื่อเมนูที่สั้นและมีรูปแบบสม่ำเสมอ",
      ],
    },
  },

  {
    id: "members",

    icon: "users",

    title: {
      en: "Members and Permissions",
      th: "สมาชิกและสิทธิ์",
    },

    description: {
      en: "Control who can access and manage each company workspace.",
      th: "ควบคุมผู้ที่สามารถเข้าถึงและจัดการพื้นที่ทำงานของแต่ละบริษัท",
    },

    steps: {
      en: [
        "Open Members from the Administration section.",
        "Review the selected company before adding or editing a member.",
        "Assign the minimum role and permissions required for the member's work.",
        "Deactivate access promptly when a member no longer requires it.",
        "Review member access periodically.",
      ],

      th: [
        "เปิด Members จากกลุ่ม Administration",
        "ตรวจสอบบริษัทที่เลือกก่อนเพิ่มหรือแก้ไขสมาชิก",
        "กำหนด Role และ Permission เท่าที่จำเป็นต่อหน้าที่",
        "ปิดสิทธิ์ทันทีเมื่อสมาชิกไม่จำเป็นต้องใช้งานแล้ว",
        "ตรวจสอบสิทธิ์สมาชิกเป็นระยะ",
      ],
    },

    notes: {
      en: [
        "Never share Admin accounts or passwords.",
        "Administrative access must be limited to authorized personnel.",
      ],

      th: [
        "ห้ามแชร์บัญชีหรือรหัสผ่าน Admin",
        "สิทธิ์ผู้ดูแลระบบต้องจำกัดเฉพาะบุคคลที่ได้รับอนุญาต",
      ],
    },
  },

  {
    id: "localization",

    icon: "languages",

    title: {
      en: "Localization",
      th: "การตั้งค่าภาษา",
    },

    description: {
      en: "Control the languages available for public content and the default website language.",
      th: "ควบคุมภาษาที่ใช้กรอกเนื้อหาและภาษาเริ่มต้นของเว็บไซต์",
    },

    steps: {
      en: [
        "Open Settings and select Localization.",
        "Keep English enabled as the system's primary content language.",
        "Enable Thai when the company requires Thai public content.",
        "Select the default public website language.",
        "Save before returning to content editors.",
        "Complete every visible language field before publishing content.",
      ],

      th: [
        "เปิด Settings แล้วเลือก Localization",
        "เปิดภาษาอังกฤษไว้เป็นภาษาหลักของระบบ",
        "เปิดภาษาไทยเมื่อบริษัทต้องการแสดงเนื้อหาภาษาไทย",
        "เลือกภาษาเริ่มต้นของเว็บไซต์",
        "บันทึกก่อนกลับไปยัง Content editor",
        "กรอกข้อมูลทุกภาษาที่แสดงให้ครบก่อน Publish",
      ],
    },

    notes: {
      en: [
        "If only English is enabled, editors display English fields only.",
        "If English and Thai are enabled, editors display both languages.",
      ],

      th: [
        "หากเปิดเฉพาะอังกฤษ Editor จะแสดงเฉพาะช่องภาษาอังกฤษ",
        "หากเปิดอังกฤษและไทย Editor จะแสดงช่องของทั้งสองภาษา",
      ],
    },
  },

  {
    id: "communication",

    icon: "bell",

    title: {
      en: "Email and Notifications",
      th: "อีเมลและการแจ้งเตือน",
    },

    description: {
      en: "Configure message delivery, sender information and website activity notifications.",
      th: "ตั้งค่าการส่งข้อความ ผู้ส่งอีเมล และการแจ้งเตือนกิจกรรมเว็บไซต์",
    },

    steps: {
      en: [
        "Open Settings and select Email.",
        "Enter and verify the approved sender configuration.",
        "Store SMTP credentials only through the protected password field.",
        "Send a test email after changing the configuration.",
        "Open Notifications and select the events that should notify staff.",
        "Verify recipient addresses before enabling production notifications.",
      ],

      th: [
        "เปิด Settings แล้วเลือก Email",
        "กรอกและตรวจสอบข้อมูลผู้ส่งที่ได้รับอนุมัติ",
        "บันทึก SMTP credential ผ่านช่องรหัสผ่านที่ป้องกันไว้เท่านั้น",
        "ส่ง Test email หลังเปลี่ยนการตั้งค่า",
        "เปิด Notifications แล้วเลือก Event ที่ต้องแจ้งพนักงาน",
        "ตรวจสอบอีเมลผู้รับก่อนเปิดการแจ้งเตือนจริง",
      ],
    },

    notes: {
      en: [
        "Never place SMTP passwords in documentation, screenshots or public source code.",
        "Use a company-controlled sender account.",
      ],

      th: [
        "ห้ามใส่ SMTP password ในคู่มือ Screenshot หรือ Source code สาธารณะ",
        "ควรใช้บัญชีผู้ส่งที่บริษัทควบคุมได้",
      ],
    },
  },

  {
    id: "privacy",

    icon: "shield",

    title: {
      en: "Privacy and Cookie Consent",
      th: "ความเป็นส่วนตัวและ Cookie Consent",
    },

    description: {
      en: "Configure consent, legal documents, retention periods and data subject contact information.",
      th: "ตั้งค่า Consent เอกสารกฎหมาย ระยะเวลาเก็บข้อมูล และช่องทางติดต่อเรื่องข้อมูลส่วนบุคคล",
    },

    steps: {
      en: [
        "Open Settings and select Privacy.",
        "Complete the privacy contact and data subject request information.",
        "Review Necessary, Analytics, Functional and Marketing categories.",
        "Keep optional categories disabled by default unless a valid lawful basis applies.",
        "Configure appropriate data retention periods.",
        "Prepare Privacy Notice, Cookie Policy and Terms of Use in every supported language.",
        "Review each legal document before publishing it.",
        "Test Accept All, Necessary Only and Cookie Settings on the public website.",
        "Confirm that Analytics does not start before Analytics consent.",
      ],

      th: [
        "เปิด Settings แล้วเลือก Privacy",
        "กรอกข้อมูลผู้ติดต่อและช่องทางใช้สิทธิของเจ้าของข้อมูล",
        "ตรวจสอบหมวด Necessary, Analytics, Functional และ Marketing",
        "ตั้งหมวดที่ไม่จำเป็นเป็นปิดโดยค่าเริ่มต้น เว้นแต่มีฐานกฎหมายรองรับ",
        "กำหนดระยะเวลาเก็บข้อมูลที่เหมาะสม",
        "จัดทำ Privacy Notice, Cookie Policy และ Terms of Use ทุกภาษาที่รองรับ",
        "ตรวจสอบเอกสารกฎหมายแต่ละฉบับก่อน Publish",
        "ทดสอบ Accept All, Necessary Only และ Cookie Settings บนเว็บไซต์จริง",
        "ตรวจสอบว่า Analytics ไม่เริ่มทำงานก่อนผู้ใช้ยินยอม",
      ],
    },

    notes: {
      en: [
        "Legal content should be reviewed by qualified legal counsel for the company's actual operations.",
        "Publish a new legal version when material terms or processing activities change.",
        "Consent records and personal data must follow the configured retention rules.",
      ],

      th: [
        "ควรให้ที่ปรึกษากฎหมายตรวจสอบเนื้อหาให้ตรงกับการดำเนินงานจริงของบริษัท",
        "ควร Publish เอกสารกฎหมายเวอร์ชันใหม่เมื่อเงื่อนไขหรือการประมวลผลข้อมูลเปลี่ยนสาระสำคัญ",
        "Consent record และข้อมูลส่วนบุคคลต้องเป็นไปตามระยะเวลา Retention ที่กำหนด",
      ],
    },
  },

  {
    id: "seo",

    icon: "search",

    title: {
      en: "Search Engine Optimization",
      th: "การตั้งค่า SEO",
    },

    description: {
      en: "Review automatically generated metadata and customize it when necessary.",
      th: "ตรวจสอบ Metadata ที่ระบบสร้างให้อัตโนมัติและแก้ไขเมื่อจำเป็น",
    },

    steps: {
      en: [
        "Enter the content title and excerpt before opening SEO fields.",
        "Review SEO Title and Description generated from the content.",
        "Confirm that tags have populated relevant SEO Keywords.",
        "Confirm that Open Graph Title follows the content title.",
        "Confirm that the cover image is used as the Open Graph Image.",
        "Edit generated values only when the content requires a specific search or sharing presentation.",
        "Preview the public page after publishing.",
      ],

      th: [
        "กรอกชื่อและ Excerpt ของเนื้อหาก่อนเปิดส่วน SEO",
        "ตรวจสอบ SEO Title และ Description ที่ระบบสร้างจากเนื้อหา",
        "ตรวจสอบว่า Tag ถูกนำไปใช้เป็น SEO Keyword ที่เกี่ยวข้อง",
        "ตรวจสอบว่า Open Graph Title ใช้ชื่อเนื้อหา",
        "ตรวจสอบว่า Cover image ถูกใช้เป็น Open Graph Image",
        "แก้ค่าที่ระบบสร้างเมื่อจำเป็นต้องกำหนดรูปแบบการค้นหาหรือแชร์โดยเฉพาะ",
        "ตรวจสอบหน้า Public หลัง Publish",
      ],
    },

    notes: {
      en: [
        "Manual SEO edits are preserved and should not be overwritten automatically.",
        "Use accurate titles and descriptions; avoid misleading keywords.",
      ],

      th: [
        "ค่า SEO ที่แก้เองจะถูกเก็บไว้และระบบไม่ควรเขียนทับอัตโนมัติ",
        "ใช้ชื่อและคำอธิบายที่ตรงกับเนื้อหา และหลีกเลี่ยง Keyword ที่ทำให้เข้าใจผิด",
      ],
    },
  },

  {
    id: "publishing",

    icon: "send",

    title: {
      en: "Publishing Workflow",
      th: "ขั้นตอนการเผยแพร่",
    },

    description: {
      en: "Use a consistent review process before content becomes publicly available.",
      th: "ใช้กระบวนการตรวจสอบที่สม่ำเสมอก่อนเผยแพร่เนื้อหาสู่สาธารณะ",
    },

    steps: {
      en: [
        "Create or edit the content while it is in Draft status.",
        "Complete all required fields and enabled languages.",
        "Check spelling, facts, dates, links, images and usage rights.",
        "Review SEO and social sharing information.",
        "Save the latest changes.",
        "Preview the content where preview is available.",
        "Publish the approved version.",
        "Open the public URL in a private browser window.",
        "Unpublish immediately if incorrect or unauthorized information is discovered.",
      ],

      th: [
        "สร้างหรือแก้ไขเนื้อหาในสถานะ Draft",
        "กรอกข้อมูลบังคับและภาษาที่เปิดใช้งานให้ครบ",
        "ตรวจสอบการสะกด ข้อเท็จจริง วันที่ ลิงก์ รูป และสิทธิ์การใช้งาน",
        "ตรวจสอบ SEO และข้อมูลสำหรับ Social sharing",
        "บันทึกการแก้ไขล่าสุด",
        "ตรวจสอบ Preview ถ้าหน้านั้นรองรับ",
        "Publish เวอร์ชันที่ได้รับอนุมัติ",
        "เปิด Public URL ผ่านหน้าต่าง Private ของ Browser",
        "Unpublish ทันทีเมื่อพบข้อมูลผิดหรือไม่ได้รับอนุญาต",
      ],
    },

    notes: {
      en: [
        "Save and Publish are separate actions in supported modules.",
        "Avoid editing production content during an active review by another user.",
      ],

      th: [
        "Save และ Publish เป็นคนละคำสั่งใน Module ที่รองรับ",
        "หลีกเลี่ยงการแก้ Production content พร้อมกับผู้ใช้อื่นที่กำลังตรวจสอบ",
      ],
    },
  },

  {
    id: "final-checklist",

    icon: "clipboard-check",

    title: {
      en: "Final Pre-Publish Checklist",
      th: "รายการตรวจสอบก่อนเปิดเว็บไซต์",
    },

    description: {
      en: "Complete this checklist before connecting the production domain or delivering Phase 1.",
      th: "ตรวจสอบรายการนี้ก่อนเชื่อม Production domain หรือส่งมอบ Phase 1",
    },

    checklist: {
      en: [
        "Company profile, logo, branding and official contact information are correct.",
        "Localization and default language are configured.",
        "Home, About, Projects, Awards, Public Content, News and Contact pages are reviewed.",
        "Only approved menu items are visible.",
        "All published links and media files work.",
        "Contact form submissions appear in Messages.",
        "Email and notification tests are successful.",
        "Privacy Notice, Cookie Policy and Terms of Use are published.",
        "Cookie consent works in a new private browser session.",
        "Analytics starts only after consent where required.",
        "Retention cleanup and Firestore TTL policies are configured.",
        "Admin members and permissions have been reviewed.",
        "No passwords, secrets or personal data appear in source code or screenshots.",
        "The website has been tested on supported desktop and mobile browsers.",
        "Lint and production build complete successfully.",
        "Production environment variables are configured in Vercel.",
        "The final Vercel deployment has been tested before connecting the domain.",
      ],

      th: [
        "ข้อมูลบริษัท โลโก้ Branding และข้อมูลติดต่ออย่างเป็นทางการถูกต้อง",
        "ตั้งค่า Localization และภาษาเริ่มต้นแล้ว",
        "ตรวจสอบ Home, About, Projects, Awards, Public Content, News และ Contact แล้ว",
        "แสดงเฉพาะเมนูที่ได้รับอนุมัติ",
        "ลิงก์และ Media ที่ Publish แล้วทำงานครบ",
        "ข้อความจาก Contact form แสดงใน Messages",
        "ทดสอบ Email และ Notification สำเร็จ",
        "Publish Privacy Notice, Cookie Policy และ Terms of Use แล้ว",
        "Cookie consent ทำงานใน Private browser session ใหม่",
        "Analytics เริ่มทำงานหลังได้รับ Consent ตามที่กำหนด",
        "ตั้งค่า Retention cleanup และ Firestore TTL policy แล้ว",
        "ตรวจสอบสมาชิก Admin และ Permission แล้ว",
        "ไม่มี Password, Secret หรือข้อมูลส่วนบุคคลใน Source code หรือ Screenshot",
        "ทดสอบเว็บไซต์บน Desktop และ Mobile browser ที่รองรับแล้ว",
        "Lint และ Production build ผ่าน",
        "ตั้งค่า Production environment variables ใน Vercel แล้ว",
        "ทดสอบ Vercel deployment ขั้นสุดท้ายก่อนเชื่อม Domain",
      ],
    },

    notes: {
      en: [
        "Keep a dated record of the final test and deployment version.",
        "Phase 2 mobile Admin improvements do not block Phase 1 when critical workflows remain usable.",
      ],

      th: [
        "ควรเก็บวันที่ ผลการทดสอบ และเวอร์ชัน Deployment ขั้นสุดท้าย",
        "งานปรับ Admin Mobile ใน Phase 2 ไม่ขัดขวาง Phase 1 หาก Workflow สำคัญยังใช้งานได้",
      ],
    },
  },
];

export function getAdminDocs(locale = "en") {
  const language = locale === "th" ? "th" : "en";

  return ADMIN_DOCS.map((section) => ({
    ...section,

    title: section.title?.[language] || section.title?.en || "",

    description:
      section.description?.[language] || section.description?.en || "",

    steps: section.steps?.[language] || section.steps?.en || [],

    checklist: section.checklist?.[language] || section.checklist?.en || [],

    notes: section.notes?.[language] || section.notes?.en || [],
  }));
}
