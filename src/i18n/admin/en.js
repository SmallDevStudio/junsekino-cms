export const adminEn = {
  common: {
    save: "Save",
    saveChanges: "Save Changes",
    saveDraft: "Save Draft",
    saving: "Saving...",
    cancel: "Cancel",
    close: "Close",
    create: "Create",
    edit: "Edit",
    delete: "Delete",
    publish: "Publish",
    unpublish: "Unpublish",
    preview: "Preview",
    refresh: "Refresh",
    search: "Search",
    loading: "Loading...",
    retry: "Retry",
    remove: "Remove",
    select: "Select",
    change: "Change",
    add: "Add",
    confirm: "Confirm",
    back: "Back",
    next: "Next",
    previous: "Previous",
    yes: "Yes",
    no: "No",
    enabled: "Enabled",
    disabled: "Disabled",
    required: "Required",
    optional: "Optional",
    noData: "No data",
    currentWorkspace: "Current workspace",
    processing: "Processing...",
    creating: "Creating...",
    changeImage: "Change Image",
    selectImage: "Select Image",
    reset: "Reset",
    back: "Back",
    next: "Next",
  },

  navigation: {
    overview: "Overview",
    content: "Content",
    management: "Management",
    administration: "Administration",

    dashboard: "Dashboard",
    home: "Home",
    about: "About",
    projects: "Projects",
    awards: "Awards",
    publicContent: "Public",
    news: "News",
    people: "People",
    contact: "Contact",

    media: "Media",
    forms: "Forms",
    popups: "Popups",
    tags: "Tags",
    search: "Search",
    notifications: "Notifications",

    company: "Company",
    members: "Members",
    settings: "Settings",
    docs: "Docs",

    expandSidebar: "Expand sidebar",
    collapseSidebar: "Collapse sidebar",

    platformAdministration: "Platform Administration",

    menuManagement: "Menu Management",

    pageManagement: "Page Management",
  },

  header: {
    notifications: "Notifications",
    preferences: "Preferences",
    settings: "Settings",
    logout: "Sign out",
    profile: "Profile",

    searchPlaceholder: "Search settings, pages, content...",

    changePassword: "Change password",
  },

  user: {
    account: "User account",

    profileDescription: "Account information and avatar",

    preferencesDescription: "Personal administration settings",

    loggingOut: "Signing out...",

    loggingOutDescription: "Ending your session...",

    logoutDescription: "Sign out from Junsekino CMS",

    roles: {
      superAdministrator: "Super Administrator",

      administrator: "Administrator",

      editor: "Editor",

      staff: "Staff",

      changePasswordDescription: "Change the password for your account",
    },
  },

  preferences: {
    title: "Preferences",

    language: {
      title: "Admin Language",

      description:
        "Choose the language used for menus, buttons, messages and other Admin interface elements.",

      english: "English",
      thai: "Thai",
    },

    density: {
      title: "Interface Density",
      compact: "Compact",
      comfortable: "Comfortable",
      spacious: "Spacious",
    },

    tooltip: {
      title: "Tooltips",

      description: "Show helpful labels when hovering over icons.",
    },
  },

  localization: {
    title: "Localization",

    publicWebsite: "Public Website",

    publicLanguages: "Public Languages",

    description:
      "Choose which languages are available for public website content. English is always enabled. Thai fields only appear in CMS editors when Thai is enabled here.",

    english: {
      title: "English",

      description: "Primary language for public content and CMS data entry.",
    },

    thai: {
      title: "Thai",

      description:
        "Enable Thai fields in Project, Award, About, Public Content and future page editors.",
    },

    defaultLanguage: {
      title: "Default Public Language",

      description:
        "This language is used when a visitor has not selected another language.",
    },

    messages: {
      saved: "Localization settings saved.",

      loadFailed: "Unable to load localization settings.",

      saveFailed: "Unable to save localization settings.",
    },
  },

  contentLanguage: {
    english: "English",
    thai: "Thai",

    thaiOptional: "Optional Thai translation.",
  },

  about: {
    title: "About",

    sectionLabel: "Content",

    description:
      "Create and preview multiple About versions. Only one version can be published at a time.",

    newVersion: "New Version",

    newVersionTitle: "New About Version",

    editTitle: "Edit About",

    editorDescription: "Cover image and rich text content",

    pageInformation: "Page Information",

    cover: {
      title: "Cover Image",

      description:
        "Recommended landscape image. Crop and focal-point controls use this presentation data.",

      selected: "Cover selected",

      none: "No cover image selected.",

      select: "Select Cover",

      change: "Change Cover",

      dialogTitle: "Select About cover",

      emptyDescription:
        "Choose an image from the Media Library and adjust the visible area.",
    },

    content: {
      title: "Content",

      description:
        "Rich text supports headings, bold, italic, links, lists, alignment and text color.",

      label: "About Content",

      placeholder: "Write About content...",
    },

    preview: {
      title: "Preview",

      description: "About page preview",
    },

    versions: {
      emptyTitle: "No About versions",

      emptyDescription: "Create the first About page version.",

      coverSelected: "Cover image selected",

      noCover: "No cover image",
    },

    actions: {
      saveHint: "Save creates a Draft. Publish is managed from the About list.",
    },

    confirm: {
      publish:
        'Publish "{title}"?\n\nThe currently published About version will automatically return to Draft.',

      unpublish: "Return this About version to Draft?",

      delete: "Delete this About version?",
    },

    messages: {
      created: "About version created.",

      updated: "About version updated.",

      published: "About page published.",

      unpublished: "About returned to Draft.",

      deleted: "About version deleted.",

      titleRequired: "English title is required.",

      loadFailed: "Unable to retrieve About versions.",

      saveFailed: "Unable to save About page.",

      publishFailed: "Unable to publish About.",

      unpublishFailed: "Unable to unpublish About.",

      deleteFailed: "Unable to delete About.",

      deletePublished: "Unpublish this About version before deleting it.",
    },

    sections: {
      title: "Content Sections",

      description:
        "Build additional About content using text-only or image-and-text sections. Sections are optional.",

      section: "Section {number}",

      layout: "Section Layout",

      layouts: {
        "text-only": "Text Only",

        "image-left": "Image Left",

        "image-right": "Image Right",
      },

      content: "Section Content",

      addText: "Add Text",

      addImageLeft: "Add Image Left",

      addImageRight: "Add Image Right",

      moveUp: "Move Up",

      moveDown: "Move Down",

      duplicate: "Duplicate Section",

      delete: "Delete Section",

      deleteConfirm: "Delete this About section?",

      imageWidth: "Image Width",

      image: {
        title: "Section Image",

        description: "Select and crop the image used alongside this section.",

        emptyTitle: "No image selected",

        emptyDescription: "Choose an image from the company Media Library.",

        select: "Select Image",
      },

      empty: {
        title: "No additional sections",

        description:
          "Sections are optional. Add one only when this About page needs additional content.",
      },
    },
  },

  project: {
    title: "Projects",

    newProject: "New Project",

    editProject: "Edit Project",

    projectContent: "Project content and information",

    basicInformation: "Basic Information",

    projectInformation: "Project Information",

    content: "Content",

    tags: "Tags",

    fields: {
      title: "Title",
      slug: "Slug",
      location: "Location",
      client: "Client",
      designYear: "Design Year",
      completionYear: "Completion Year",
      area: "Area",
      unit: "Unit",
      excerpt: "Excerpt",
      content: "Content",
    },

    messages: {
      created: "Project created.",

      updated: "Project updated.",

      saveFailed: "Unable to save project.",

      requiredFields: "Please complete the required fields.",
    },

    manager: {
      sectionLabel: "Content Management",

      description: "Manage architecture and design projects for {company}.",

      thisCompany: "this company",

      searchPlaceholder: "Search projects...",

      projectCount: "{count} projects",

      featured: "Featured",

      untitledProject: "Untitled project",

      untitledCategory: "Untitled category",

      stats: {
        all: "All projects",
      },

      filters: {
        allStatuses: "All statuses",

        allCategories: "All categories",
      },

      noCompany: {
        title: "No company selected",

        description: "Select a workspace before managing projects.",
      },

      empty: {
        title: "No projects yet",

        description: "Create the first project for this company.",

        searchTitle: "No matching projects",

        searchDescription: "Try changing the search term or filters.",
      },

      dates: {
        scheduled: "Scheduled {date}",

        published: "Published {date}",

        updated: "Updated {date}",
      },

      actions: {
        cancelSchedule: "Cancel Schedule",
      },

      errors: {
        loadProjects: "Unable to retrieve projects.",

        loadCategories: "Unable to retrieve project categories.",
      },
    },

    cover: {
      noCover: "No cover image",
    },

    publish: {
      sectionLabel: "Publishing",
      title: "Publish Project",

      description:
        "Publish this project immediately or schedule it to become public at a future date and time.",

      now: {
        title: "Publish Now",
        description: "Make this project publicly available immediately.",
        action: "Publish Project",
        publishing: "Publishing...",
      },

      schedule: {
        title: "Schedule",
        description: "Publish automatically at a selected future time.",
        dateLabel: "Publishing Date & Time",
        action: "Schedule Project",
        scheduling: "Scheduling...",
      },

      visibility: {
        title: "Public website visibility",
        description:
          "Once published, this project can appear on the public website and its Project category can become visible in public navigation.",
      },

      messages: {
        published: "Project published successfully.",
        scheduled: "Project scheduled successfully.",
      },

      errors: {
        titleRequired: "Project title is required before publishing.",
        contentRequired: "Project content is required before publishing.",
        categoryRequired: "Project category is required before publishing.",
        categoryNotFound: "Selected project category was not found.",
        subCategoryNotFound: "Selected project sub-category was not found.",
        invalidSubCategory:
          "Selected sub-category does not belong to the selected category.",
        selectSchedule: "Select a publishing date and time.",
        invalidSchedule: "Invalid publishing date and time.",
        scheduleFuture: "Scheduled publishing time must be in the future.",
        scheduleFailed: "Unable to schedule project.",
        publishFailed: "Unable to publish project.",
      },
    },

    unpublish: {
      title: "Unpublish Project",
      cancelScheduleTitle: "Cancel Schedule",

      description:
        "This project will no longer be publicly published and will return to Draft.",

      cancelScheduleDescription:
        "This will cancel the scheduled publishing time and return the project to Draft.",

      keepStatus: "Keep Current Status",

      action: "Unpublish",

      cancelScheduleAction: "Cancel Schedule",

      contentSafe: {
        title: "Project content will not be deleted.",
        description:
          "You can continue editing and publish the project again later.",
      },

      messages: {
        unpublished: "Project unpublished.",
        scheduleCancelled: "Scheduled publishing cancelled.",
      },

      errors: {
        unpublishFailed: "Unable to unpublish project.",
        cancelScheduleFailed: "Unable to cancel schedule.",
      },
    },

    delete: {
      sectionLabel: "Destructive Action",

      title: "Delete Project",

      description:
        "This project will be removed from the active CMS project list and archived internally.",

      action: "Delete Project",

      deleting: "Deleting...",

      warning: {
        published: "This project is currently published.",
        scheduled: "This project is currently scheduled.",
        description:
          "Deleting it will remove it from the active content collection. Continue only if this is intentional.",
      },

      softDelete: {
        title: "This is a soft delete.",
        description:
          "The database record and audit history are preserved. Restore functionality can be added later.",
      },

      confirm: {
        prefix: "Type",
        suffix: "to confirm",
      },

      messages: {
        deleted: "Project deleted.",
      },

      errors: {
        notFound: "Project not found.",
        alreadyDeleted: "Project has already been deleted.",
        failed: "Unable to delete project.",
      },
    },
    category: {
      title: "Category",

      description:
        "Assign the project to a category and optional sub-category.",

      category: "Category",
      subCategory: "Sub-category",

      noCategory: "No category",
      noSubCategory: "No sub-category",

      createCategory: "Create new category",

      createSubCategory: "Create new sub-category",

      newCategory: "New Category",

      newSubCategory: "New Sub-category",

      selectCategoryFirst:
        "Select a category first before creating a sub-category.",

      slugHint:
        "Used in the public URL. Use lowercase English letters, numbers and hyphens.",

      fields: {
        name: "Name",
        slug: "Slug",
      },

      placeholders: {
        englishName: "Category name",

        thaiName: "ชื่อหมวดหมู่",
      },

      messages: {
        categoryCreated: "Category created.",

        subCategoryCreated: "Sub-category created.",
      },

      errors: {
        nameRequired: "English category name is required.",

        slugInvalid: "Please enter an English slug with at least 2 characters.",

        createFailed: "Unable to create category.",
      },
    },

    credits: {
      title: "Project Credits",

      description:
        "Add architecture, interior, landscape and consultant credits. Multiple people or companies can be added to each group.",

      fields: {
        name: "Name",
      },

      placeholders: {
        english: "Person or company name",

        thai: "ชื่อบุคคลหรือบริษัท",
      },

      empty: "No {type} credits added.",

      addCredit: "Add {type}",

      remove: "Remove {type} credit",

      creditNumber: "Credit {number}",

      groups: {
        architecture: {
          label: "Architecture",

          description:
            "Architects or architecture teams credited for this project.",
        },

        interior: {
          label: "Interior",

          description: "Interior designers or interior design teams.",
        },

        landscape: {
          label: "Landscape",

          description: "Landscape architects or landscape design teams.",
        },

        consultant: {
          label: "Consultant",

          description: "Consultants and other professional collaborators.",
        },
      },
    },

    editor: {
      sectionLabel: "Project Editor",

      basicDescription:
        "Core project information used across the CMS and public website.",

      contentDescription:
        "Create the main project description using formatted rich text.",

      projectInfoDescription:
        "Project metadata displayed with the public project details.",

      tagsDescription:
        "Add keywords for filtering, search and content organization.",

      tagsPlaceholder: "architecture",

      yearHint: "Use a four-digit year, for example 2026.",

      saveHint:
        "Saving updates the project content. Publishing is managed separately from the project list.",

      placeholders: {
        titleEnglish: "Project title",

        titleThai: "ชื่อโปรเจกต์",

        excerptEnglish: "Short project introduction",

        excerptThai: "ข้อความแนะนำโปรเจกต์แบบสั้น",

        contentEnglish: "Write the project description...",

        contentThai: "เขียนรายละเอียดโปรเจกต์ภาษาไทย...",
      },

      validation: {
        titleRequired: "English project title is required.",

        slugRequired: "Project slug is required.",
      },

      slug: {
        hint: "Used in the public project URL.",

        infoTitle: "Project Slug",

        infoDescription:
          "A unique URL-friendly identifier. Use lowercase English letters, numbers and hyphens.",

        exists: "This slug is already in use.",

        noAlternative:
          "This slug is already in use and no alternative slug is currently available.",

        confirmSuggestion:
          'The slug "{current}" is already in use.\n\nWould you like to use "{suggested}" instead?',

        reserveFailed:
          "Unable to reserve an available slug. Please enter another slug.",
      },

      excerpt: {
        infoTitle: "Project Excerpt",

        infoDescription:
          "A short introduction used in previews, search results or areas where the full description is not appropriate.",
      },

      area: {
        infoTitle: "Project Area",

        infoDescription:
          "Enter the numeric project area and choose the corresponding measurement unit.",
      },

      featured: {
        title: "Featured Project",

        description:
          "Mark this project as featured so it can be prioritized in supported public website sections.",
      },

      units: {
        rai: "Rai",
      },

      errors: {
        loadTags: "Unable to retrieve project tags.",
      },
    },
  },

  editor: {
    bold: "Bold",
    italic: "Italic",
    underline: "Underline",
    heading2: "Heading 2",
    heading3: "Heading 3",
    bulletList: "Bullet List",
    orderedList: "Numbered List",
    quote: "Quote",
    alignLeft: "Align Left",
    alignCenter: "Align Center",
    alignRight: "Align Right",
    link: "Link",
    textColor: "Text color",
    companyColor: "Company color",
    clearFormatting: "Clear Formatting",
    undo: "Undo",
    redo: "Redo",
    enterUrl: "Enter URL",
    content: "Content",
    placeholderEnglish: "Write content...",
    placeholderThai: "Write Thai content...",
  },

  status: {
    draft: "Draft",
    review: "Review",
    scheduled: "Scheduled",
    published: "Published",
    public: "Public",
    active: "Active",
    unpublished: "Unpublished",
    inactive: "Inactive",
    archived: "Archived",
    deleted: "Deleted",
    error: "Error",
    ready: "Ready",
  },

  errors: {
    authenticationRequired: "Authentication required.",

    permissionDenied: "Permission denied.",

    companyNotFound: "Company not found.",

    pageNotFound: "Page not found.",

    invalidData: "Invalid data.",

    unknown: "Something went wrong.",
  },

  displaySettings: {
    title: "Display Settings",

    description: "Personalize your admin workspace",

    language: {
      description: "Changes only the administration interface.",
    },

    density: {
      description: "Controls spacing in lists, forms and panels.",
    },

    sidebar: {
      title: "Sidebar",

      description: "Choose the default desktop sidebar state.",

      expanded: "Expanded",
      collapsed: "Collapsed",
    },

    on: "On",
    off: "Off",
    fontSize: {
      title: "Text Size",

      description:
        "Adjust text size across the Admin interface without changing layout scale.",

      small: "Small",
      medium: "Medium",
      large: "Large",
    },
  },

  companySwitcher: {
    workspace: "Workspace",
    current: "Current workspace",
    select: "Select a company to manage",
    singleCompany: "Manage the current company or create a new one",
    create: "Create company",
    createDescription: "Add a new independent workspace",
    loading: "Loading workspace",
    unavailable: "Company unavailable",
    noCompany: "No company available",
  },

  media: {
    upload: {
      dropTitle: "Drop images here or click to upload",

      formats: "JPG, PNG, WebP or AVIF • up to {size}",

      errors: {
        unsupportedType: "Unsupported file type.",

        fileTooLarge: "File exceeds {size}.",

        failed: "Upload failed.",
      },
    },

    picker: {
      title: "Select Media",

      close: "Close media picker",

      multipleDescription: "Select one or more images.",

      singleDescription: "Select an image.",

      tabs: {
        library: "Library",

        upload: "Upload",

        importUrl: "Import URL",
      },

      searchPlaceholder: "Search media...",

      resultCount: "{count} images",

      loading: "Loading media...",

      emptyTitle: "No images yet",

      emptyDescription: "Upload an image or import one from a URL.",

      noSearchResults: "No matching images",

      noSearchDescription: "Try another file name, caption or keyword.",

      selectedCount: "{count} selected",

      noneSelected: "No image selected",

      confirmSingle: "Select Image",

      confirmMultiple: "Add Selected",

      untitled: "Untitled image",

      errors: {
        loadFailed: "Unable to load media.",
      },

      crop: {
        selectDescription:
          "Select an image, then continue to adjust its visible area.",

        noteTitle: "Crop enabled",

        noteDescription:
          "After selecting the image, you can move, zoom and adjust its visible area before applying it.",

        continue: "Adjust Image",

        preparing: "Preparing...",

        errors: {
          previewFailed: "Unable to prepare this image for cropping.",
        },
      },
    },

    importUrl: {
      title: "Import image from URL",

      description:
        "Paste a direct image URL. The image will be copied into this company's Media Library and processed like a normal upload.",

      fieldLabel: "Image URL",

      directOnly: "Direct image URLs only",

      supportedFormats:
        "Supported formats are JPEG, PNG, WebP and AVIF. Web pages, local network addresses and unsupported files are rejected.",

      action: "Import Image",

      importing: "Importing...",

      messages: {
        imported: "Image imported.",
      },

      errors: {
        required: "Enter an image URL.",

        invalid: "Enter a valid HTTP or HTTPS image URL.",

        failed: "Unable to import image.",
      },
    },

    manager: {
      upload: "Upload Media",

      sectionLabel: "Content Management",

      title: "Media",

      description: "Upload and manage media assets used across the website.",

      loadingWorkspace: "Loading workspace...",

      refreshing: "Refreshing...",

      searchPlaceholder: "Search media...",

      assetCount: "{count} assets",

      untitled: "Untitled media",

      noCompany: {
        title: "No company selected",

        description: "Select a workspace before managing media.",
      },

      empty: {
        title: "No media yet",

        description:
          "Upload your first media asset to start building the Media Library.",

        searchTitle: "No matching media",

        searchDescription: "Try another file name, title, tag or keyword.",
      },

      errors: {
        loadFailed: "Unable to retrieve media.",
      },

      summary: {
        all: "All Media",

        images: "Images",

        documents: "Documents",

        other: "Other",
      },

      filters: {
        all: "All",

        images: "Images",

        documents: "Documents",

        other: "Other",
      },

      sort: {
        newest: "Newest",

        oldest: "Oldest",

        nameAsc: "Name A–Z",

        nameDesc: "Name Z–A",

        largest: "Largest",

        smallest: "Smallest",
      },
    },

    card: {
      openPreview: "Open preview",

      previewFailed: "Preview unavailable.",

      retryPreview: "Retry preview",

      loadingPreview: "Loading...",

      statusUnknown: "Unknown",
    },

    crop: {
      sectionLabel: "Image Position",

      coverTitle: "Adjust Cover Image",

      coverDescription:
        "Move and zoom the image to choose the area that should remain visible in the cover.",

      avatarTitle: "Adjust Avatar",

      avatarDescription: "Position the photo inside the circular avatar area.",

      zoom: "Zoom",

      zoomIn: "Zoom in",

      zoomOut: "Zoom out",

      aspect: "Aspect Ratio",

      rotateLeft: "Rotate left",

      rotateRight: "Rotate right",

      apply: "Apply Crop",
    },

    uploadDialog: {
      title: "Upload Media",

      description: "Add assets to this company's Media Library.",

      hint: "Uploaded assets are processed automatically before becoming available.",
    },

    details: {
      sectionLabel: "Media Asset",

      loadingPreview: "Loading preview…",

      previewFailed: "Unable to load preview.",

      metadata: {
        title: "Metadata",

        description:
          "Default information attached to this media asset. Other content can inherit these values automatically.",
      },

      fields: {
        title: "Title",

        alt: "Alternative Text",

        altHint: "Describe the image for accessibility and search engines.",

        description: "Description",

        caption: "Caption",

        credit: "Credit",

        tags: "Tags",

        tagsPlaceholder: "Type and press Enter",
      },

      fileInfo: {
        title: "File Information",

        fileName: "File Name",

        dimensions: "Dimensions",

        size: "File Size",

        type: "MIME Type",

        format: "Format",
      },

      usage: {
        title: "Used In",

        description: "Content currently referencing this media asset.",

        retry: "Try again",

        untitled: "Untitled content",

        modules: {
          project: "Project",

          award: "Award",

          homeSlideshow: "Home",

          page: "Page",

          publicContent: "Public",
        },

        locations: {
          featuredImage: "Cover Image",

          hero: "Hero Image",

          gallery: "Gallery · Image {number}",

          slideshow: "Slideshow · Slide {number}",

          sectionImage: "Section {number} · Image",

          sectionGallery: "Section {section} · Gallery Image {number}",
        },

        empty: {
          title: "Not currently used",

          description:
            "This media asset is not referenced by any tracked content.",
        },

        errors: {
          loadFailed: "Unable to retrieve media usage.",
        },
      },

      messages: {
        saved: "Media metadata updated.",
      },

      errors: {
        loadFailed: "Unable to load media metadata.",

        saveFailed: "Unable to save media metadata.",
      },
    },

    /*
     * IMPORTANT:
     * delete MUST be a sibling of details.
     *
     * Correct:
     * media.delete.title
     *
     * Not:
     * media.details.delete.title
     */

    delete: {
      title: "Delete Media",

      delete: "Delete Media",

      removeAndDelete: "Remove from content & delete",

      checkingUsage: "Checking where this media is being used…",

      inUseTitle: "Used in {count} places",

      inUseDescription:
        "Deleting this media will also remove its references from the content listed below.",

      unusedDescription:
        "This media is not currently used by any tracked content. It can be deleted safely.",

      messages: {
        deleted: "Media deleted.",

        detachedAndDeleted: "Media removed from content and deleted.",
      },

      errors: {
        failed: "Unable to delete media.",
      },
    },
  },

  tagInput: {
    placeholder: "architecture",

    suggestions: "Suggestions",

    loadingSuggestions: "Loading suggestions...",

    remove: "Remove {tag}",

    hint: "Type to search existing tags. Press Enter or comma to add a new tag.",
  },

  contentMedia: {
    title: "Media",

    description:
      "Select the cover image and gallery images from the company Media Library.",

    mediaId: "Media ID: {id}",

    errors: {
      previewUnavailable: "Preview unavailable.",
    },

    cover: {
      title: "Cover Image",

      description:
        "Primary image used for listings, previews and supported public layouts.",

      selected: "Selected cover image",

      select: "Select Cover Image",

      remove: "Remove cover image",

      emptyTitle: "No cover image",

      emptyDescription:
        "Select an image from the Media Library to represent this content.",

      pickerTitle: "Select Cover Image",
    },

    gallery: {
      title: "Gallery",

      description: "Images are displayed in the order shown below.",

      add: "Add Images",

      emptyTitle: "No gallery images",

      emptyDescription: "Add one or more images from the Media Library.",

      movePrevious: "Move image backward",

      moveNext: "Move image forward",

      remove: "Remove image",

      pickerTitle: "Select Gallery Images",
    },
  },

  contentSeo: {
    title: "Search Engine Optimization",

    description:
      "Configure search metadata and social sharing information for this content.",

    fields: {
      title: "SEO Title",

      description: "Meta Description",

      keywords: "SEO Keywords",

      ogTitle: "Open Graph Title",

      ogDescription: "Open Graph Description",
    },

    placeholders: {
      title: "Search result title",

      description: "Short description for search engines",

      ogTitle: "Title used when shared on social media",

      ogDescription: "Description used when shared on social media",
    },

    keywords: {
      placeholder: "architecture",

      remove: "Remove {keyword}",
    },

    ogImage: {
      title: "Open Graph Image",

      description:
        "Optional image used when this content is shared on social media.",

      mediaId: "Media ID: {id}",

      pickerTitle: "Select Open Graph Image",
    },

    robots: {
      index: {
        title: "Allow Indexing",

        description:
          "Allow search engines to include this page in search results.",
      },

      follow: {
        title: "Follow Links",

        description:
          "Allow search engines to follow links contained on this page.",
      },
    },
  },

  award: {
    title: "Awards",
    newAward: "New Award",
    editAward: "Edit Award",

    fields: {
      title: "Title",
      slug: "Slug",
      linkedProject: "Linked Project",
      awardName: "Award Name",
      organization: "Organization",
      category: "Award Category",
      level: "Award Level",
      year: "Award Year",
      excerpt: "Excerpt",
      content: "Content",
    },

    editor: {
      sectionLabel: "Award Editor",

      headerDescription: "Create and manage award information.",

      basic: {
        title: "Basic Information",

        description: "Configure the award title, URL and related project.",
      },

      awardInfo: {
        title: "Award Information",

        description:
          "Enter the official award name, organization, category, level and year.",
      },

      summary: {
        title: "Summary",

        description: "Add a short introduction used in listings and previews.",
      },

      content: {
        title: "Award Content",

        description:
          "Add the full award story or supporting information using formatted rich text.",
      },

      placeholders: {
        titleEnglish: "Award title",

        titleThai: "ชื่อรางวัล",

        excerptEnglish: "Short award introduction",

        excerptThai: "ข้อความแนะนำรางวัลแบบสั้น",

        contentEnglish: "Write award details...",

        contentThai: "เขียนรายละเอียดรางวัลภาษาไทย...",
      },

      validation: {
        titleRequired: "English award title is required.",

        slugRequired: "Award slug is required.",

        awardNameRequired: "English award name is required.",
      },

      slug: {
        hint: "Used in the public Award URL.",

        infoTitle: "Award Slug",

        infoDescription:
          "A unique URL-friendly identifier using lowercase English letters, numbers and hyphens.",

        exists: "This slug is already in use.",

        noAlternative:
          "This slug is already in use and no alternative is available.",

        confirmSuggestion:
          'The slug "{current}" is already in use.\n\nWould you like to use "{suggested}" instead?',

        reserveFailed:
          "Unable to reserve an available slug. Please enter another slug.",
      },

      projectHint: "Optional. Link this award to an existing project.",

      projectInfoTitle: "Linked Project",

      projectInfoDescription:
        "Linking an award to a project allows the public website to connect the Award and Project automatically.",

      noLinkedProject: "No linked project",

      year: {
        infoTitle: "Award Year",

        infoDescription:
          "The year in which the award was officially received or announced.",
      },

      featured: {
        title: "Featured Award",

        description:
          "Prioritize this award in supported public Award sections.",
      },

      saveHint:
        "Save the award first. Publishing is managed separately from the Award list.",
    },

    messages: {
      requiredFields: "Please complete the required fields.",

      created: "Award created successfully.",

      updated: "Award updated successfully.",

      saveFailed: "Unable to save award.",
    },

    publish: {
      sectionLabel: "Publishing",

      title: "Publish Award",

      now: {
        title: "Publish Now",

        description: "Make this award publicly available immediately.",

        action: "Publish Award",
      },

      schedule: {
        title: "Schedule",

        description:
          "Publish this award automatically at a future date and time.",

        dateLabel: "Publishing Date & Time",

        action: "Schedule Award",
      },

      messages: {
        published: "Award published successfully.",

        scheduled: "Award scheduled successfully.",
      },

      errors: {
        selectSchedule: "Select a publishing date and time.",

        invalidSchedule: "Invalid publishing date and time.",

        futureSchedule: "Scheduled publishing time must be in the future.",

        failed: "Unable to publish award.",
      },
    },

    delete: {
      sectionLabel: "Destructive Action",

      title: "Delete Award",

      description: "will be removed from the active Award library.",

      action: "Delete Award",

      deleting: "Deleting...",

      softDelete: {
        title: "This is a soft delete.",

        description:
          "The Award record and audit history remain stored internally and can support Restore functionality later.",
      },

      confirm: {
        prefix: "Type",

        suffix: "to confirm",
      },

      messages: {
        deleted: "Award deleted successfully.",
      },

      errors: {
        failed: "Unable to delete award.",
      },
    },

    manager: {
      sectionLabel: "Content Management",

      description: "Manage awards and project recognition for {company}.",

      thisCompany: "this company",

      searchPlaceholder: "Search awards...",

      awardCount: "{count} awards",

      untitledAward: "Untitled award",

      untitledProject: "Untitled project",

      featured: "Featured",

      project: "Project: {project}",

      stats: {
        all: "All awards",
      },

      filters: {
        allStatuses: "All statuses",

        allYears: "All years",

        allProjects: "All projects",
      },

      actions: {
        cancelSchedule: "Cancel Schedule",
      },

      dates: {
        scheduled: "Scheduled {date}",

        published: "Published {date}",
      },

      noCompany: {
        title: "No company selected",

        description: "Select a workspace before managing awards.",
      },

      empty: {
        title: "No awards yet",

        description: "Create the first award for this company.",

        searchTitle: "No matching awards",

        searchDescription: "Try changing the search term or filters.",
      },

      messages: {
        unpublished: "Award unpublished.",

        scheduleCancelled: "Scheduled publishing cancelled.",
      },

      errors: {
        loadAwards: "Unable to retrieve awards.",

        loadProjects: "Unable to retrieve projects.",

        unpublishFailed: "Unable to unpublish award.",
      },
    },

    cover: {
      noCover: "No award cover image",
    },
  },

  publicContent: {
    title: "Public Content",
    newContent: "New Content",

    types: {
      article: "Article",
      video: "Video",
      embed: "Embed",
    },

    providers: {
      youtube: "YouTube",
      facebook: "Facebook",
      vimeo: "Vimeo",
      instagram: "Instagram",
      tiktok: "TikTok",
      other: "Other",
    },

    manager: {
      sectionLabel: "Content Management",

      description: "Manage articles, videos and external media for {company}.",

      thisCompany: "this company",

      searchPlaceholder: "Search public content...",

      itemCount: "{count} items",

      untitled: "Untitled content",

      featured: "Featured",

      stats: {
        all: "All content",
      },

      filters: {
        allStatuses: "All statuses",

        allTypes: "All types",

        allProviders: "All providers",
      },

      actions: {
        cancelSchedule: "Cancel Schedule",
      },

      dates: {
        scheduled: "Scheduled {date}",

        published: "Published {date}",

        updated: "Updated {date}",
      },

      noCompany: {
        title: "No company selected",

        description: "Select a workspace before managing public content.",
      },

      empty: {
        title: "No public content yet",

        description: "Create the first public content item for this company.",

        searchTitle: "No matching content",

        searchDescription: "Try changing the search term or filters.",
      },

      messages: {
        published: "Public content published successfully.",

        scheduled: "Public content scheduled successfully.",

        unpublished: "Public content unpublished.",

        scheduleCancelled: "Scheduled publish cancelled.",

        deleted: "Public content deleted.",
      },

      errors: {
        loadFailed: "Unable to retrieve public content.",

        publishFailed: "Unable to publish public content.",

        unpublishFailed: "Unable to unpublish public content.",

        deleteFailed: "Unable to delete public content.",
      },
    },

    editor: {
      sectionLabel: "Public Content Editor",

      newTitle: "New Content",

      editTitle: "Edit Content",

      headerDescription:
        "Create articles, videos and external media for the public website.",

      createAction: "Create Content",

      saveHint:
        "Save changes first. Publishing is managed separately from the Public Content list.",

      typeSection: {
        title: "Content Type",

        description:
          "Choose how this content will be presented on the public website.",
      },

      contentTypes: {
        article: "Long-form editorial, news feature or media article.",

        video:
          "Video content hosted on YouTube, Vimeo, Facebook or another supported platform.",

        embed: "Embedded social post or external media content.",
      },

      basic: {
        title: "Basic Information",

        description: "Configure the public title and URL for this content.",
      },

      fields: {
        title: "Title",

        slug: "Slug",

        sourceUrl: "Source URL",

        provider: "Provider",

        externalId: "External ID",

        excerpt: "Excerpt",

        content: "Content",
      },

      placeholders: {
        titleEnglish: "Content title",

        titleThai: "ชื่อเนื้อหา",

        excerptEnglish: "Short introduction for this content",

        excerptThai: "ข้อความแนะนำเนื้อหาแบบสั้น",

        articleContentEnglish: "Write the article content...",

        articleContentThai: "เขียนเนื้อหาบทความภาษาไทย...",

        mediaContentEnglish: "Optional description or supporting content...",

        mediaContentThai: "รายละเอียดเพิ่มเติมภาษาไทย...",
      },

      slug: {
        hint: "Used in the public Content URL.",

        infoTitle: "Content Slug",

        infoDescription:
          "A unique URL-friendly identifier. Use lowercase English letters, numbers and hyphens.",

        exists: "This slug is already in use.",

        noAlternative:
          "This slug is already in use and no alternative slug is currently available.",

        confirmSuggestion:
          'The slug "{current}" is already in use.\n\nWould you like to use "{suggested}" instead?',

        reserveFailed:
          "Unable to reserve an available slug. Please enter another slug.",
      },

      source: {
        title: "External Source",

        videoDescription:
          "Paste the video URL. The provider, external ID and available metadata will be detected automatically.",

        embedDescription:
          "Enter the external media URL and select the provider used for this embedded content.",

        urlHint:
          "YouTube URLs can be detected automatically. Other supported providers can be selected manually.",

        infoTitle: "External Source",

        infoDescription:
          "The original public URL of the video or external media. Metadata can be fetched automatically when the provider is supported.",

        autoDetect: "Auto detect",

        externalIdHint: "Detected automatically when supported.",

        externalIdPlaceholder: "External media ID",
      },

      metadata: {
        fetch: "Fetch Media Info",

        loading: "Loading...",

        preview: "External Media Preview",

        untitled: "Untitled media",

        published: "Published {date}",

        duration: "Duration {duration}",

        openSource: "Open Source",

        messages: {
          loaded: "Media information loaded.",
        },

        errors: {
          loadFailed: "Unable to retrieve media information.",
        },

        autoCover: {
          title: "Automatic External Cover",

          description:
            "The external thumbnail will automatically be used as the cover when no custom featured image is selected.",

          override:
            "A custom cover is currently selected and will override the external thumbnail.",
        },
      },

      content: {
        title: "Content",

        articleDescription:
          "Write the main article using the Rich Text editor. English content is required for Article content.",

        mediaDescription:
          "Add an optional excerpt and supporting description for this media content.",
      },

      excerpt: {
        infoTitle: "Content Excerpt",

        infoDescription:
          "A short introduction used in public listings, previews and search-related layouts.",
      },

      tags: {
        title: "Tags",

        description:
          "Add keywords for classification, search and related content.",

        placeholder: "architecture",
      },

      featured: {
        title: "Featured Content",

        description:
          "Prioritize this content in public layouts that support featured items.",
      },

      validation: {
        contentTypeRequired: "Select a content type.",

        titleRequired: "English title is required.",

        slugRequired: "Content slug is required.",

        articleContentRequired: "English article content is required.",

        sourceUrlRequired: "Source URL is required for this content type.",

        providerRequired: "Select or detect a provider.",

        completeRequired: "Please complete the required fields.",
      },

      messages: {
        created: "Public content created successfully.",

        updated: "Public content updated successfully.",
      },

      errors: {
        loadTags: "Unable to retrieve public content tags.",

        saveFailed: "Unable to save public content.",
      },
    },

    publish: {
      sectionLabel: "Publishing",

      description:
        "Choose whether to publish this content now or schedule it for later.",

      now: {
        title: "Publish Now",

        description:
          "Make this content available on the public website immediately.",

        action: "Publish Now",
      },

      schedule: {
        title: "Schedule",

        description: "Publish automatically at a future date and time.",

        dateLabel: "Publish Date & Time",

        action: "Schedule",
      },

      visibility: {
        title: "Public website visibility",

        description:
          "Once published, this content can appear on the public website according to its content type and website layout.",
      },

      errors: {
        selectSchedule: "Select a publish date and time.",

        invalidSchedule: "The selected date and time is invalid.",

        futureSchedule: "Scheduled publishing time must be in the future.",
      },
    },

    confirm: {
      lifecycleSectionLabel: "Publishing Status",

      contentSafe: {
        title: "Content will not be deleted.",

        description:
          "The content remains available in Admin and can be edited or published again later.",
      },

      unpublish: {
        title: "Unpublish Content?",

        description:
          "This content will be removed from the public website and returned to Draft.",

        action: "Unpublish",
      },

      cancelSchedule: {
        title: "Cancel Scheduled Publish?",

        description:
          "The scheduled publishing time will be removed and this content will return to Draft.",

        action: "Cancel Schedule",
      },

      delete: {
        sectionLabel: "Destructive Action",

        title: "Delete Public Content?",

        description:
          "This content will be removed from the active content list.",

        action: "Delete Content",

        softDelete: {
          title: "This is a soft delete.",

          description:
            "The database record and audit history are preserved internally and can support Restore functionality later.",
        },
      },
    },
  },

  news: {
    title: "News",
    newNews: "New News",

    manager: {
      sectionLabel: "Content Management",

      description:
        "Manage news, announcements and editorial updates for {company}.",

      thisCompany: "this company",

      searchPlaceholder: "Search news...",

      itemCount: "{count} items",

      untitled: "Untitled news",

      featured: "Featured",

      category: "Category: {category}",

      author: "Author: {author}",

      editorNextStep:
        "News Editor and publishing dialogs are added in the next step.",

      stats: {
        all: "All news",
      },

      filters: {
        allStatuses: "All statuses",

        allCategories: "All categories",
      },

      actions: {
        cancelSchedule: "Cancel Schedule",
      },

      dates: {
        scheduled: "Scheduled {date}",

        published: "Published {date}",

        updated: "Updated {date}",
      },

      noCompany: {
        title: "No company selected",

        description: "Select a workspace before managing News.",
      },

      empty: {
        title: "No news yet",

        description: "Create the first News item for this company.",

        searchTitle: "No matching news",

        searchDescription: "Try changing the search term or filters.",
      },

      errors: {
        loadFailed: "Unable to retrieve News.",
      },
    },

    // EN — ภายใน news

    editor: {
      sectionLabel: "News Editor",
      newTitle: "New News",
      editTitle: "Edit News",

      headerDescription:
        "Create and manage news content for the public website.",

      createAction: "Create News",

      saveHint:
        "Save the News first. Publishing is managed separately from the News list.",

      fields: {
        title: "Title",
        slug: "Slug",
        category: "Category",
        author: "Author",
        excerpt: "Excerpt",
        content: "Content",
      },

      basic: {
        title: "Basic Information",
        description: "Configure the title, URL, category and author.",
      },

      summary: {
        title: "Summary",
        description: "Add a short introduction for News listings and previews.",
      },

      content: {
        title: "News Content",
        description:
          "Write the complete News article using the Rich Text editor.",
      },

      placeholders: {
        titleEnglish: "News title",
        titleThai: "ชื่อข่าว",
        category: "Architecture",
        author: "Junsekino",
        contentEnglish: "Write the News article...",
        contentThai: "เขียนเนื้อหาข่าวภาษาไทย...",
      },

      category: {
        hint: "Use an existing category or enter a new category.",
      },

      author: {
        hint: "Public author or editorial credit shown with this News item.",
      },

      slug: {
        hint: "Used in the public News URL.",
        infoTitle: "News Slug",

        infoDescription:
          "A unique URL-friendly identifier using lowercase English letters, numbers and hyphens.",

        exists: "This News slug is already in use.",
      },

      cover: {
        title: "Cover Image",

        description:
          "Primary image used for News listings, previews and supported public layouts.",

        select: "Select Cover Image",

        emptyDescription: "Choose an image from the company Media Library.",

        pickerTitle: "Select News Cover",
      },

      tags: {
        title: "Tags",

        description:
          "Add keywords for search, classification and related content.",
      },

      featured: {
        title: "Featured News",

        description:
          "Prioritize this News item in public layouts that support featured content.",
      },

      validation: {
        titleRequired: "English News title is required.",

        slugRequired: "News slug is required.",

        contentRequired: "English News content is required.",

        completeRequired: "Please complete the required fields.",
      },

      messages: {
        created: "News created successfully.",

        updated: "News updated successfully.",
      },

      errors: {
        saveFailed: "Unable to save News.",
      },
    },

    publish: {
      sectionLabel: "Publishing",

      now: {
        title: "Publish Now",

        description:
          "Make this News item available on the public website immediately.",

        action: "Publish News",
      },

      schedule: {
        title: "Schedule",

        description:
          "Publish this News item automatically at a future date and time.",

        dateLabel: "Publishing Date & Time",

        action: "Schedule News",
      },

      errors: {
        selectSchedule: "Select a publishing date and time.",

        invalidSchedule: "Invalid publishing date and time.",

        futureSchedule: "Scheduled publishing time must be in the future.",
      },
    },

    confirm: {
      unpublish: {
        title: "Unpublish News?",

        description:
          "This News item will be removed from the public website and returned to Draft.",

        action: "Unpublish",
      },

      cancelSchedule: {
        title: "Cancel Scheduled Publish?",

        description:
          "The scheduled publishing time will be removed and this News item will return to Draft.",

        action: "Cancel Schedule",
      },

      delete: {
        title: "Delete News?",

        description:
          "This News item will be removed from the active News library using soft delete.",

        action: "Delete News",
      },
    },

    messages: {
      published: "News published successfully.",

      scheduled: "News scheduled successfully.",

      unpublished: "News unpublished successfully.",

      scheduleCancelled: "Scheduled publishing cancelled.",

      deleted: "News deleted successfully.",
    },

    errors: {
      loadFailed: "Unable to retrieve News.",

      publishFailed: "Unable to publish News.",

      unpublishFailed: "Unable to unpublish News.",

      deleteFailed: "Unable to delete News.",
    },
  },

  coverImage: {
    title: "Cover Image",

    description:
      "Select an image and control which area remains visible in the layout.",

    emptyTitle: "No cover image selected",

    emptyDescription: "Choose an image from the company Media Library.",

    select: "Select Image",

    pickerTitle: "Select Cover Image",

    selected: "Selected image",

    adjust: "Adjust",

    cropped: "Custom crop",

    remove: "Remove image",

    mediaId: "Media ID: {id}",

    errors: {
      previewFailed: "Unable to load image preview.",
    },
  },

  homeSlideshow: {
    editor: {
      sectionLabel: "Home Slideshow",

      newTitle: "New Slideshow",

      editTitle: "Edit Slideshow",

      description: "Manage images and ordering for the homepage slideshow.",

      createAction: "Create Slideshow",

      information: {
        title: "Information",

        description: "Internal slideshow name and description.",
      },

      fields: {
        name: "Name",

        description: "Description",

        alt: "Alternative Text",

        caption: "Caption",

        url: "Link URL",
      },

      slides: {
        title: "Slides",

        count: "{count} images",

        slide: "Slide {number}",

        add: "Add Media",

        emptyTitle: "No slideshow images",

        emptyDescription:
          "Select images from the Media Library to build this slideshow.",

        active: "Active",

        enableLink: "Enable link",

        newTab: "Open in new tab",

        moveUp: "Move Up",

        moveDown: "Move Down",

        remove: "Remove Slide",

        pickerTitle: "Select Slideshow Images",
      },

      validation: {
        nameRequired: "English slideshow name is required.",

        slideRequired: "Add at least one image to the slideshow.",
      },

      messages: {
        created: "Slideshow created successfully.",

        updated: "Slideshow updated successfully.",
      },

      errors: {
        saveFailed: "Unable to save slideshow.",
      },
    },

    manager: {
      sectionLabel: "Content Management",

      title: "Home",

      description:
        "Manage homepage slideshow sets for {company}. Only one slideshow can be published at a time.",

      newSlideshow: "New Slideshow",

      createSlideshow: "Create Slideshow",

      thisCompany: "this company",

      publishConfirm:
        'Publish "{name}" as the homepage slideshow?\n\nThe currently published slideshow will automatically return to Draft.',

      deleteConfirm:
        'Delete "{name}"?\n\nThis action will remove the slideshow from the CMS.',

      messages: {
        published: "Homepage slideshow published.",

        deleted: "Slideshow deleted.",
      },

      errors: {
        loadTitle: "Unable to load homepage content",

        loadFailed: "Unable to retrieve home slideshows.",

        publishFailed: "Unable to publish slideshow.",

        deleteFailed: "Unable to delete slideshow.",

        publishedDelete:
          "Published slideshow cannot be deleted. Publish another slideshow first.",
      },

      noCompany: {
        title: "No company selected",

        description: "Select a workspace before managing homepage content.",
      },

      empty: {
        title: "No homepage slideshow yet",

        description:
          "Create the first slideshow and select images from the company's Media Library.",
      },
    },

    card: {
      untitled: "Untitled Slideshow",

      totalImages: "Total images",

      activeImages: "Active images",

      currentHomepage: "Current homepage slideshow",

      updated: "Updated {date}",
    },
  },

  contact: {
    sectionLabel: "Content Management",

    title: "Contact",

    description:
      "Manage the public contact page, company information and website enquiry form.",

    newVersion: "New Version",

    newVersionTitle: "New Contact Version",

    editTitle: "Edit Contact",

    editorDescription:
      "Manage the information displayed on the public Contact page.",

    pageInformation: "Page Information",

    companyInformation: "Company Information",

    companyInformationDescription:
      "Contact information displayed publicly on this company website.",

    fields: {
      coverCaption: "Cover Caption",

      companyDisplayName: "Company Display Name",

      establishedYear: "Established Year",

      address: "Address",

      telephone: "Telephone",

      email: "Email",
    },

    cover: {
      title: "Contact Cover",

      description:
        "Main image displayed on the Contact page. About and Contact will use this same page-cover proportion.",

      none: "No cover image selected",

      emptyDescription:
        "Select an image from Media Library for the Contact page.",

      select: "Select Cover",

      dialogTitle: "Select Contact Cover",
    },

    form: {
      title: "Contact Form",

      defaultName: "Contact Us",

      preparing: "Preparing contact form...",

      systemForm: "System Form",

      enabled: "Show contact form",
    },

    versions: {
      emptyTitle: "No Contact page yet",

      emptyDescription: "Create the first Contact page version to get started.",

      coverSelected: "Cover selected",

      noCover: "No cover image",
    },

    preview: {
      title: "Contact Preview",

      description:
        "Preview mode. The exact public website layout will be added next.",
    },

    actions: {
      saveHint: "Save changes as a draft, then publish when the page is ready.",
    },

    confirm: {
      publish: 'Publish "{title}"?',

      unpublish: "Unpublish this Contact page?",

      delete: "Delete this Contact draft?",
    },

    messages: {
      loadFailed: "Unable to load Contact.",

      setupFailed: "Unable to prepare Contact form.",

      titleRequired: "English page title is required.",

      emailInvalid: "Enter a valid contact email address.",

      saveFailed: "Unable to save Contact.",

      created: "Contact draft created.",

      updated: "Contact updated.",

      published: "Contact published.",

      publishFailed: "Unable to publish Contact.",

      unpublished: "Contact unpublished.",

      unpublishFailed: "Unable to unpublish Contact.",

      deletePublished: "Unpublish this Contact page before deleting it.",

      deleted: "Contact deleted.",

      deleteFailed: "Unable to delete Contact.",
    },

    companyProfile: {
      title: "Company Profile information",

      description:
        "Address, telephone, email, website and business hours are managed centrally in Company Settings.",

      edit: "Edit Company Profile",

      address: "Address",

      phone: "Telephone",

      secondaryPhone: "Secondary telephone",

      email: "Email",

      website: "Website",

      businessHours: "Business hours",

      emptyTitle: "Company Profile is incomplete",

      emptyDescription:
        "Add contact information in Company Settings before publishing this Contact page.",
    },
  },

  notifications: {
    title: "Notifications",

    refresh: "Refresh notifications",

    unreadCount: "{count} unread",

    allCaughtUp: "You're all caught up",

    fallbackTitle: "Notification",

    viewAllMessages: "View all messages",

    empty: {
      title: "No notifications",

      description: "New website activity will appear here.",
    },

    messages: {
      loadFailed: "Unable to load notifications.",
    },
  },

  messages: {
    sectionLabel: "Communication",

    title: "Messages",

    description: "View and manage messages submitted through website forms.",

    mailbox: "Mailbox",

    searchPlaceholder: "Search messages...",

    resultCount: "{count} messages",

    fallbackMessage: "Message",

    fallbackPreview: "Form submission",

    close: "Close message",

    doubleClickHint:
      "Click a message to preview it. Double-click to open it in a new window.",

    folders: {
      inbox: "Inbox",

      unread: "Unread",

      in_progress: "In Progress",

      resolved: "Resolved",

      archived: "Archived",

      spam: "Spam",

      trash: "Trash",
    },

    actions: {
      inProgress: "In Progress",

      resolved: "Resolved",

      archive: "Archive",

      spam: "Spam",

      trash: "Move to Trash",

      restore: "Restore",

      deletePermanently: "Delete Permanently",

      openWindow: "Open in new window",
    },

    readers: {
      none: "Not read yet",

      unknown: "Unknown user",

      user: "User",

      title: "Read by {count} people",

      readAt: "Read {date}",
    },

    drawer: {
      sectionLabel: "Form Submission",

      messageInformation: "Message Information",

      submissionDetails: "Submission Details",

      form: "Form",

      page: "Page",

      referrer: "Referrer",

      received: "Received",
    },

    deletePermanent: {
      title: "Delete permanently?",

      description:
        "This message will be permanently removed and cannot be restored.",

      warning:
        "Permanent deletion is only available for messages already in Trash.",

      action: "Delete Permanently",
    },

    messages: {
      statusUpdated: "Message status updated.",

      movedToTrash: "Message moved to Trash.",

      restored: "Message restored.",

      deleted: "Message permanently deleted.",
    },

    errors: {
      loadFailed: "Unable to retrieve messages.",

      updateFailed: "Unable to update message.",

      trashFailed: "Unable to move message to Trash.",

      restoreFailed: "Unable to restore message.",

      deleteFailed: "Unable to permanently delete message.",

      notFound: "Message not found.",
    },

    empty: {
      title: "No messages",

      description: "Messages matching this mailbox will appear here.",

      trashTitle: "Trash is empty",

      trashDescription:
        "Deleted messages will appear here until permanently removed.",
    },

    noCompany: {
      title: "No company selected",

      description: "Select a workspace before viewing messages.",
    },

    window: {
      back: "Close Window",
    },
  },

  members: {
    company: "Company",
    title: "Members",
    description: "Manage user accounts, roles, and company access",
    loading: "Loading members...",
    empty: "No members found",
    total: "{count} members",

    columns: {
      user: "User",
      globalRole: "Global role",
      companyAccess: "Company access",
      status: "Account status",
      actions: "Actions",
    },

    avatar: {
      title: "Profile image",
      description:
        "Select an image and adjust its position for the circular profile display.",
      emptyTitle: "No profile image",
      emptyDescription:
        "Select an image from the media library or upload a new image for your account.",
      select: "Select profile image",
      pickerTitle: "Select profile image",
    },

    actions: {
      add: "Add member",
      view: "View details",
      edit: "Edit",
      refresh: "Refresh",
      delete: "Delete",
      deleteAccount: "Delete account",
      revokeAccess: "Revoke company access",
      resetPassword: "Reset password",
    },

    filters: {
      search: "Search name, email, or phone",
      allGlobalRoles: "All global roles",
      allAccess: "All company access",
      allStatuses: "All statuses",
    },

    globalRoles: {
      superadmin: "Superadmin",
      user: "User",
    },

    access: {
      admin: "Company admin",
      editor: "Editor",
      noAccess: "No access",
    },

    accessDescriptions: {
      admin: "Can manage company information and members.",
      editor: "Can manage company content according to assigned permissions.",
      noAccess:
        "The user cannot enter this company. Their account and access to other companies remain unchanged.",
    },

    groups: {
      admin: "Company admin",
      editor: "Editor",
      unassigned: "Unassigned",
    },

    status: {
      active: "Active",
      inactive: "Inactive",
      suspended: "Suspended",
      unassigned: "No access",
    },

    sections: {
      account: "Account information",
      companyAccess: "Company access",
    },

    fields: {
      name: "Display name",
      email: "Email",
      phone: "Phone",
      password: "Initial password",
      globalRole: "Global role",
      accountStatus: "Account status",
      companyAccess: "Company access",
      membershipStatus: "Membership status",
      group: "User group",
      status: "Status",
    },

    detail: {
      title: "Member details",
    },

    editor: {
      createTitle: "Add member",
      editTitle: "Edit member",
    },

    permission: {
      title: "Access denied",
      description:
        "Your account does not have permission to manage company members.",
    },

    confirmDeleteGlobal:
      'Delete the account "{name}" from the entire platform? The user will no longer be able to sign in.',
    confirmRevoke: 'Revoke "{name}" access to this company?',

    errors: {
      load: "Unable to load members.",
      save: "Unable to save member information.",
      delete: "Unable to delete or revoke this member.",
      createAccessRequired:
        "A new member must have Company admin or Editor access.",
      cannotDeleteSelf: "You cannot delete your own account.",
    },

    passwordReset: {
      title: "Reset password",
      description:
        "Set a temporary password for this user. All existing sessions will be revoked immediately.",
      temporaryPassword: "Temporary password",
      securityNotice:
        "This password is shown only in this dialog. Send it to the user through a secure channel.",

      fields: {
        password: "Temporary password",
        confirmPassword: "Confirm temporary password",
        mustChangePassword: "Require password change at next sign-in",
        mustChangePasswordDescription:
          "The user cannot access the Dashboard or other modules until a new password is set.",
      },

      requirements: {
        title: "The password must contain",
        length: "At least 8 characters",
        uppercase: "At least one uppercase letter",
        lowercase: "At least one lowercase letter",
        number: "At least one number",
      },

      validation: {
        length: "Password must contain at least 8 characters.",
        uppercase: "Password must contain at least one uppercase letter.",
        lowercase: "Password must contain at least one lowercase letter.",
        number: "Password must contain at least one number.",
        mismatch: "The password and confirmation do not match.",
      },

      actions: {
        generate: "Generate password",
        copy: "Copy",
        copied: "Copied",
        reset: "Reset password",
        resetting: "Resetting...",
      },

      success: {
        title: "Password reset",
        description: "The user can sign in with this temporary password.",
        forcedDescription:
          "The user must sign in with this temporary password and choose a new password before using the system.",
      },

      errors: {
        reset: "Unable to reset password.",
        copy: "Unable to copy the password.",
      },
    },
  },

  companyAdmin: {
    eyebrow: "Company Workspace",

    title: "Company",

    description: "Manage company information, languages and brand colors.",

    saved: "Company settings saved successfully.",

    fields: {
      name: "Company name",

      legalName: "Legal name",

      shortName: "Short name",

      slug: "Company slug",

      status: "Status",

      defaultLocale: "Default language",

      enableThai: "Enable Thai content",
    },

    colors: {
      title: "Brand Colors",

      primary: "Primary",

      secondary: "Secondary",

      accent: "Accent",

      background: "Background",

      surface: "Surface",

      text: "Text",
    },

    errors: {
      load: "Unable to load company settings.",

      save: "Unable to save company settings.",
    },

    create: {
      title: "Create Company",

      description: "Create a new company workspace.",

      action: "Add Company",

      saved: "Company created successfully.",

      errors: {},

      success: "Company created successfully.",

      creating: "Creating company...",

      steps: {
        identity: "Identity",
        profile: "Contact",
        branding: "Branding",
      },

      identity: {
        title: "Company identity",
        description:
          "Enter the information required to create an independent company workspace.",
      },

      profile: {
        title: "Company contact information",
        description:
          "This information is used by the public Contact page. You can complete it later.",
      },

      branding: {
        title: "Initial branding",
        description:
          "Set the initial text logo and brand colors. Image logos can be uploaded after creation.",

        preview: "Preview",
        button: "Primary action",

        logoLater:
          "Image logos and favicon can be uploaded from Company Settings after the workspace is created.",
      },

      errors: {
        save: "Unable to create company.",

        bootstrap:
          "The company was created, but some default content could not be prepared. You can run setup again later.",

        nameRequired: "Company name is required.",

        slugRequired: "Company slug is required.",

        emailInvalid: "Contact email is invalid.",

        websiteInvalid: "Website must be a valid URL including https://",

        colorInvalid: "Brand colors must use a valid HEX format.",

        save: "Unable to create company.",
      },
    },

    sections: {
      basic: {
        title: "Company information",
        description: "Basic company identity and public website access.",
      },

      profile: {
        title: "Company profile and contact",
        description:
          "This information is the primary source used by the public Contact page.",
      },

      logo: {
        title: "Company logo",
        description:
          "Upload image logos or use a text logo as an automatic fallback.",
      },

      branding: {
        title: "Brand colors",
        description:
          "Use primary for important actions, secondary for contrast, and accent for decorative highlights.",
      },

      theme: {
        title: "Public website theme",
        description:
          "Configure the background, surface, text and border colors of the public website.",
      },

      social: {
        title: "Social media",
        description:
          "Links displayed on the public website and company header.",
      },

      seo: {
        title: "Search and social sharing",
        description:
          "Default SEO metadata used when an individual page does not provide its own values.",
      },
    },

    social: {
      facebook: "Facebook",
      instagram: "Instagram",
      youtube: "YouTube",
      linkedin: "LinkedIn",
      tiktok: "TikTok",
      x: "X",
      pinterest: "Pinterest",
      line: "LINE",
    },

    seo: {
      title: "SEO title",
      description: "SEO description",
      keywords: "Keywords",
      keywordsHelp: "Separate keywords with commas.",
      ogTitle: "Social sharing title",
      ogDescription: "Social sharing description",
      ogImage: "Social sharing image",
      ogImageDescription:
        "Recommended aspect ratio 1.91:1 for Facebook, LINE and other social platforms.",
      emptyImage: "No sharing image selected",
      emptyImageDescription: "Select an image from the company media library.",
      selectImage: "Select image",
      pickerTitle: "Select social sharing image",
      allowIndex: "Allow search engines to index this company site",
      allowFollow: "Allow search engines to follow links",
      thDisabledTitle: "Thai SEO is disabled",
      thDisabledDescription:
        "Enable Thai in Company Information to configure Thai SEO metadata.",
    },

    help: {
      slug: "Changing the slug changes the public website URL.",

      superadminOnly: "This field can only be changed by a Superadmin.",
    },

    status: {
      active: "Active",
      inactive: "Inactive",
      archived: "Archived",
    },

    profile: {
      taxId: "Tax ID",
      registrationNumber: "Registration number",
      email: "Contact email",
      phone: "Telephone",
      secondaryPhone: "Secondary telephone",
      website: "Website",
      addressEn: "Address — English",
      addressTh: "Address — Thai",
      mapUrl: "Google Maps URL",
      latitude: "Latitude",
      longitude: "Longitude",
      businessHoursEn: "Business hours — English",
      businessHoursTh: "Business hours — Thai",
    },

    logo: {
      mode: "Logo display",
      text: "Main text",
      highlight: "Highlighted text",

      modes: {
        auto: "Automatic",
        image: "Image logo",
        text: "Text logo",
      },

      lightTitle: "Logo for light background",
      lightDescription: "Used when the website background is light.",

      darkTitle: "Logo for dark background",
      darkDescription: "Used when the website background is dark.",

      faviconTitle: "Favicon",
      faviconDescription: "Square icon used by browsers and shortcuts.",

      emptyTitle: "No logo selected",
      emptyDescription: "Select an image from the company media library.",

      emptyFavicon: "No favicon selected",
      emptyFaviconDescription: "Select a square image from the media library.",

      select: "Select image",
      pickerTitle: "Select company logo",
      faviconPickerTitle: "Select favicon",
    },

    colorHelp: {
      primary: "Buttons, active menus, links and important highlights.",

      secondary: "Secondary brand color and primary button contrast.",

      accent: "Badges, decorative elements and small highlights.",
    },

    theme: {
      defaultMode: "Default website mode",

      allowVisitorPreference: "Allow visitors to choose Light or Dark mode",

      modes: {
        light: "Light",
        dark: "Dark",
        system: "System",
      },

      lightTitle: "Light theme",
      darkTitle: "Dark theme",

      colors: {
        background: "Page background",
        surface: "Card and section surface",
        text: "Primary text",
        mutedText: "Secondary text",
        border: "Border",
      },

      previewTitle: "Theme preview",

      previewDescription:
        "Preview the relationship between the company brand and website theme colors.",

      previewAction: "Primary action",
    },
  },

  password: {
    title: "Change password",
    forcedTitle: "Password change required",
    description:
      "Enter your current password and choose a new password for your account.",
    forcedDescription:
      "For security, you must change your temporary password before accessing the system.",

    fields: {
      current: "Current password",
      new: "New password",
      confirm: "Confirm new password",
    },

    requirements: {
      title: "Your password must contain",
      length: "At least 8 characters",
      uppercase: "At least one uppercase letter",
      lowercase: "At least one lowercase letter",
      number: "At least one number",
    },

    validation: {
      length: "Password must contain at least 8 characters.",
      uppercase: "Password must contain at least one uppercase letter.",
      lowercase: "Password must contain at least one lowercase letter.",
      number: "Password must contain at least one number.",
      mismatch: "The new password and confirmation do not match.",
      samePassword:
        "The new password must be different from the current password.",
    },

    actions: {
      change: "Change password",
      changing: "Changing password...",
    },

    success: {
      title: "Password changed",
      description: "Redirecting you to the dashboard.",
    },

    errors: {
      change: "Unable to change password.",
      currentIncorrect: "The current password is incorrect.",
      tooManyRequests: "Too many attempts. Please try again later.",
      recentLogin: "Please verify your current password again.",
    },
  },

  profile: {
    eyebrow: "User account",
    title: "My profile",
    description:
      "Manage your personal information, profile image, and work information.",
    loading: "Loading profile...",
    success: "Your profile has been saved.",

    sections: {
      avatar: "Profile image",
      personal: "Personal information",
      work: "Work information",
    },

    fields: {
      name: "Display name",
      email: "Email",
      phone: "Phone",
      employeeCode: "Employee code",
      position: "Position",
      department: "Department",
      bio: "Bio",
    },

    errors: {
      load: "Unable to load profile.",
      save: "Unable to save profile.",
    },
  },

  privacy: {
    eyebrow: "User account",
    title: "Privacy and notifications",
    description:
      "Control personal information visibility, notifications, and account security.",
    loading: "Loading preferences...",
    success: "Your preferences have been saved.",

    sections: {
      visibility: "Personal information visibility",
      notifications: "Notifications",
      security: "Security",
    },

    options: {
      company: "Company members",
      admins: "Company administrators",
      private: "Only me",
    },

    fields: {
      avatar: {
        label: "Profile image",
        description: "Choose who can see your profile image.",
      },

      phone: {
        label: "Phone number",
        description: "Choose who can see your phone number.",
      },

      bio: {
        label: "Bio",
        description: "Choose who can see your bio.",
      },

      lastActive: {
        label: "Last active time",
        description: "Choose who can see your last active time.",
      },
    },

    notifications: {
      email: {
        label: "Email notifications",
        description: "Receive important notifications by email.",
      },

      browser: {
        label: "Browser notifications",
        description: "Display notifications while using the CMS.",
      },

      forms: {
        label: "New messages and forms",
        description: "Notify me when a new form or message is submitted.",
      },

      members: {
        label: "Member changes",
        description: "Notify me when member roles or statuses change.",
      },

      security: {
        label: "Security notifications",
        description:
          "Password resets and important account activity. This notification cannot be disabled.",
      },
    },

    security: {
      password: {
        title: "Password",
        description: "Change the password for your account.",
        action: "Change password",
      },
    },

    errors: {
      load: "Unable to load preferences.",
      save: "Unable to save preferences.",
    },
  },

  settings: {
    email: {
      title: "Email Settings",

      description:
        "Configure the email provider, sender identity and notification recipients.",

      enabled: {
        title: "Email Notifications",

        description: "Allow this company to send notification emails.",
      },

      provider: {
        title: "Email Provider",

        description: "Choose how this company sends outgoing email.",

        resendDescription:
          "Managed email delivery using the server Resend integration.",

        smtpDescription: "Connect to your organization's own SMTP mail server.",
      },

      smtp: {
        title: "SMTP Server",

        description: "Configure the mail server used by this company.",

        host: "SMTP Server",

        port: "Port",

        security: "Security",

        username: "Username",

        password: "Password",

        passwordConfigured: "Password configured",

        notConfigured: "Not configured",

        passwordPlaceholder: "Enter SMTP password",

        passwordKeepPlaceholder: "Leave empty to keep current password",

        testConnection: "Test Connection",

        sendTestEmail: "Send Test Email",
      },

      sender: {
        title: "Sender Identity",

        name: "Sender Name",

        email: "Sender Email",

        replyTo: "Reply-To",
      },

      recipients: {
        title: "Notification Recipients",

        description: "People who should receive website notification emails.",
      },

      securityNote:
        "SMTP passwords are encrypted and stored separately from company settings. Passwords are never returned to the browser after saving.",

      save: "Save Email Settings",

      messages: {
        loadFailed: "Unable to retrieve email settings.",

        saveFailed: "Unable to save email settings.",

        saved: "Email settings saved.",

        passwordSaveFailed: "Unable to save SMTP password.",

        invalidRecipient: "Enter a valid email address.",

        duplicateRecipient: "This email is already added.",

        invalidSender: "Sender email is invalid.",

        invalidReplyTo: "Reply-to email is invalid.",

        smtpHostRequired: "SMTP server is required.",

        smtpPortInvalid: "SMTP port is invalid.",

        testConnectionSuccess: "SMTP connection successful.",

        testConnectionFailed: "Unable to connect to the SMTP server.",

        testEmailPending: "Send Test Email will be enabled in the next step.",

        testEmailRecipientRequired:
          "Add at least one recipient before sending a test email.",

        testEmailSent: "Test email sent to {email}.",

        testEmailFailed: "Unable to send test email.",
      },
    },
    privacy: {
      title: "Privacy & Consent",

      description:
        "Manage cookie consent, privacy contacts, data subject rights and retention policies.",

      languages: {
        en: "English",
        th: "Thai",
      },

      actions: {
        save: "Save privacy settings",
        saving: "Saving...",
      },

      banner: {
        title: "Cookie Banner",

        description:
          "Control when the cookie notice appears and edit the text displayed to visitors.",

        showCookieBanner: "Show cookie banner",

        showCookieBannerDescription:
          "Display the consent banner to visitors who have not recorded a decision.",

        allowRejectOptional: "Allow optional cookies to be rejected",

        allowRejectOptionalDescription:
          "Provide a direct option for rejecting non-essential cookies.",

        showPreferences: "Show cookie preferences",

        showPreferencesDescription:
          "Allow visitors to choose individual cookie categories.",

        fields: {
          title: "Banner title",
          description: "Banner description",
          acceptAll: "Accept all button",
          rejectOptional: "Reject optional button",
          preferences: "Preferences button",
          savePreferences: "Save preferences button",
          privacyLink: "Privacy notice link",
          cookieLink: "Cookie policy link",
        },
      },

      consent: {
        title: "Consent Management",

        description:
          "Configure consent validity, renewal and server-side proof of decisions.",

        enabled: "Enable consent management",

        enabledDescription:
          "Apply consent controls and category preferences on the public website.",

        version: "Consent version",

        versionDescription:
          "Increase this value when processing purposes or consent choices materially change.",

        cookieMaxAgeDays: "Consent cookie lifetime (days)",

        cookieMaxAgeDaysDescription:
          "Visitors will be asked again after this period expires.",

        renewOnPolicyChange: "Renew consent after policy changes",

        renewOnPolicyChangeDescription:
          "Ask visitors again when a published legal document version changes.",

        recordProof: "Record consent proof",

        recordProofDescription:
          "Store a server-side record of the visitor's consent decision.",

        anonymizeTechnicalData: "Anonymize technical data",

        anonymizeTechnicalDataDescription:
          "Store hashed technical identifiers instead of raw values.",
      },

      categories: {
        title: "Cookie Categories",

        description:
          "Choose which optional categories are available and explain their purposes.",

        necessary: "Necessary",

        necessaryDescription:
          "Required for security and core website operation. This category cannot be disabled.",

        analytics: "Analytics",

        analyticsDescription:
          "Measurement used to understand website usage and performance.",

        functional: "Functional",

        functionalDescription: "Optional features and visitor preferences.",

        marketing: "Marketing",

        marketingDescription:
          "Advertising and campaign measurement. Keep disabled until it is actually used.",

        name: "Category name",

        purpose: "Purpose description",
      },

      rights: {
        title: "Data Subject Rights",

        description:
          "Configure how people can exercise their privacy and personal-data rights.",

        enabled: "Enable data subject requests",

        enabledDescription:
          "Publish contact instructions for privacy-related requests.",

        requestEmail: "Request email",

        responseDays: "Response period (days)",

        responseDaysDescription:
          "Internal target for responding to a verified request.",

        allowAccessRequest: "Access request",

        allowCorrectionRequest: "Correction request",

        allowDeletionRequest: "Deletion request",

        allowConsentWithdrawal: "Consent withdrawal",

        allowDataPortabilityRequest: "Data portability request",

        instructions: {
          en: "Instructions in English",
          th: "Instructions in Thai",
        },
      },

      contact: {
        title: "Privacy Contact",

        description:
          "Contact details shown in privacy documents and data-subject request instructions.",

        companyName: {
          en: "Company name in English",
          th: "Company name in Thai",
        },

        address: {
          en: "Address in English",
          th: "Address in Thai",
        },

        email: "Privacy contact email",

        phone: "Contact telephone",

        dpoEmail: "DPO email",

        dpoEmailDescription:
          "Leave blank when the company has not formally appointed a Data Protection Officer.",
      },

      retention: {
        title: "Data Retention",

        description:
          "Set how long each data category is retained before automatic cleanup.",

        consentRecordDays: "Consent records (days)",

        consentRecordDaysDescription:
          "Retention period for consent proof. Default: 730 days.",

        analyticsRawDays: "Raw analytics events (days)",

        analyticsRawDaysDescription:
          "Short-term retention for detailed analytics events. Default: 90 days.",

        analyticsAggregateMonths: "Aggregated analytics (months)",

        analyticsAggregateMonthsDescription:
          "Retention period for reports containing less identifying detail.",

        formSubmissionDays: "Form submissions (days)",

        formSubmissionDaysDescription:
          "Retention period for messages and files submitted through public forms.",

        securityLogDays: "Security logs (days)",

        securityLogDaysDescription:
          "Retention period for technical and security-related records.",
      },

      messages: {
        loadFailed: "Unable to load privacy settings.",

        saveFailed: "Unable to save privacy settings.",

        saved: "Privacy settings saved successfully.",
      },
    },

    legal: {
      title: "Legal Documents",

      description:
        "Create, review and publish versioned legal documents for the selected company.",

      types: {
        privacy: "Privacy Notice",
        cookies: "Cookie Policy",
        terms: "Terms & Conditions",
      },

      actions: {
        newDraft: "New Draft",
        copyToDraft: "Copy to New Draft",
        saveDraft: "Save Draft",
        saving: "Saving...",
        publish: "Publish",
        publishing: "Publishing...",
      },

      history: {
        title: "Version History",
        empty: "No versions have been created.",
        untitled: "Untitled document",
      },

      editor: {
        newDraft: "New Draft",
        editDraft: "Edit Draft",
        viewVersion: "View Version",
        publishedReadonly:
          "Published and archived versions cannot be edited. Copy this version to create a new draft.",
      },

      fields: {
        title: "Document Title",

        content: "Document Content",

        contentHint:
          "Enter the full legal document text. Markdown-style plain text may be used.",

        changeSummary: "Change Summary",

        effectiveAt: "Effective Date",

        requireReConsent: "Require consent again",

        requireReConsentDescription:
          "Visitors with an earlier consent record will be asked to provide consent again after this version is published.",
      },

      status: {
        draft: "Draft",
        published: "Published",
        archived: "Archived",
      },

      confirm: {
        publish:
          "Publish this legal document version? Published content cannot be edited.",
      },

      messages: {
        loadFailed: "Unable to load legal documents.",

        saveFailed: "Unable to save the legal draft.",

        publishFailed: "Unable to publish the legal document.",

        titleRequired: "Enter a document title in at least one language.",

        contentRequired: "Enter document content in at least one language.",

        created: "Legal draft created successfully.",

        updated: "Legal draft updated successfully.",

        published: "Legal document published successfully.",
      },
    },
  },

  menuManagement: {
    eyebrow: "Website Navigation",

    title: "Menu Management",

    description: "Edit, arrange and control the public menu for {company}.",

    loading: "Loading menu...",

    noCompany: "Select a company before managing its public menu.",

    summary: {
      total: "Total Items",

      visible: "Visible",

      external: "External Links",
    },

    types: {
      system: "System",

      external: "External",
    },

    fields: {
      label: "Menu Label",

      externalUrl: "External URL",

      externalPlaceholder: "https://example.com",

      visible: "Show in public menu",

      newTab: "Open in new tab",
    },

    actions: {
      moveUp: "Move menu item up",

      moveDown: "Move menu item down",

      delete: "Delete menu item",

      addExternal: "Add External Link",

      save: "Save Menu",
    },

    labels: {
      newItem: "New menu item",

      externalUrl: "External URL",
    },

    confirm: {
      delete: "Delete this external menu item?",

      reset: "Reset the complete menu to the company defaults?",
    },

    messages: {
      saved: "Menu saved successfully.",

      reset: "Menu reset to defaults.",
    },

    errors: {
      load: "Unable to load menu.",

      save: "Unable to save menu.",

      reset: "Unable to reset menu.",

      englishRequired: "Every menu item requires an English label.",

      invalidExternal: "External links must begin with http:// or https://.",
    },
  },
};
