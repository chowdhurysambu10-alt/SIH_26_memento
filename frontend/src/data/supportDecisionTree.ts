export interface DecisionOption {
  label: string;
  nextId: string;
}

export interface DecisionNode {
  id: string;
  message: string;
  options?: DecisionOption[];
}

export const supportDecisionTree: Record<string, DecisionNode> = {
  "root": {
    "id": "root",
    "message": "Welcome to Memento Support! I am here to help you navigate the platform and answer any questions. Please select a module you need help with:",
    "options": [
      {
        "label": "Platform Onboarding & Accounts",
        "nextId": "onboarding"
      },
      {
        "label": "Submitting a Problem",
        "nextId": "submit_problem"
      },
      {
        "label": "Feed & Top Problems",
        "nextId": "feed_issues"
      },
      {
        "label": "Analytics & Dashboards",
        "nextId": "analytics"
      },
      {
        "label": "Algorithmic Triage Mechanics",
        "nextId": "triage"
      },
      {
        "label": "Academic Credit System",
        "nextId": "academic"
      },
      {
        "label": "Role-Specific Guidelines",
        "nextId": "roles"
      },
      {
        "label": "Website Navigation Guide",
        "nextId": "nav_guide"
      }
    ]
  },
  "onboarding": {
    "id": "onboarding",
    "message": "What do you need assistance with regarding your account?",
    "options": [
      {
        "label": "Registration & Verification",
        "nextId": "register_verify"
      },
      {
        "label": "Password Constraints",
        "nextId": "password_rules"
      },
      {
        "label": "Updating Profile Information",
        "nextId": "profile_update"
      },
      {
        "label": "Requesting Verification (Blue Tick)",
        "nextId": "onboarding_verify"
      },
      {
        "label": "Go Back",
        "nextId": "root"
      }
    ]
  },
  "register_verify": {
    "id": "register_verify",
    "message": "If you are on the sign-in page, please enter your registered email address and your 8-character password to access your account.\nIf you are a new user on the registration page, please provide your full name, permanent address, and the email address you wish to register (this cannot be changed later). You must also create a password that includes at least one uppercase letter, one lowercase letter, one special character, and one number. Should you encounter any issues or errors during this process, please try again later or contact our support team at mementoserviceco@gmail.com.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "onboarding"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "password_rules": {
    "id": "password_rules",
    "message": "Passwords must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.\nIf you have forgotten your password but still have access to your registered email account, navigate to the sign-in page and enter your email address. Below the password field, click on the \"Forgot Password\" link, then click the \"Send Reset OTP\" button. Please check your email inbox for a one-time password (OTP) from Memento (valid for 10 minutes). Copy this OTP and enter it on the website. You will then be prompted to set and verify a new password.\nTip: Consider saving your password in a secure password manager.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "onboarding"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "profile_update": {
    "id": "profile_update",
    "message": "To update your profile, click on your name in the top navigation bar (next to options like Home, Updates, Top Problems, etc.) and select 'Profile' from the dropdown menu. Here, you can update your name and email address. Remember to click 'Save Changes' once you are done.\nTo change your password, select the 'Change Password' option at the top of the profile window. Click the 'Send OTP to Email' button, then check your email for a one-time password (OTP) from Memento (valid for 10 minutes). Enter the OTP on the website, and you will be prompted to set and verify a new password.\nTip: Consider saving your password in a secure password manager.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "onboarding"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "onboarding_verify": {
    "id": "onboarding_verify",
    "message": "Want to show the community that you are a trusted, real user? You can request to get officially verified! Just head over to your Profile settings and look for the 'Request Verification' button. This opens up a special form where you can submit a government-issued ID or other official documents. Once our team manually reviews your submission and confirms your identity, you will get a shiny verified badge next to your name. This goes a long way in building trust when you report or support civic issues.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "onboarding"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "submit_problem": {
    "id": "submit_problem",
    "message": "Having trouble submitting a civic issue?",
    "options": [
      {
        "label": "How to use the Map/GPS",
        "nextId": "submit_gps"
      },
      {
        "label": "Image Upload Limits",
        "nextId": "submit_images"
      },
      {
        "label": "AI Auto-Categorization",
        "nextId": "submit_ai"
      },
      {
        "label": "Duplicate Warnings",
        "nextId": "submit_dupes"
      },
      {
        "label": "Using the In-App Camera",
        "nextId": "submit_camera"
      },
      {
        "label": "Go Back",
        "nextId": "root"
      }
    ]
  },
  "submit_gps": {
    "id": "submit_gps",
    "message": "We require exact GPS coordinates when you submit a problem statement. To submit a problem, click the '+' icon located in the bottom right corner of the site. If you prefer not to copy and paste a URL from Google Maps, you can use the location tracking option by clicking 'Detect Location' on the submission form (ensure browser location permissions are enabled). This will track your current location. If you are reporting a problem at a different location, please open Google Maps in a new tab, find the exact location, copy the URL from the address bar, and paste it into the problem submission window.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "submit_problem"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "submit_images": {
    "id": "submit_images",
    "message": "You can upload up to 4 images, with a maximum size of 5MB each. Supported formats are JPG, PNG, and WebP. Please ensure that the images are authentic photos taken with your device's camera; AI-generated images, downloaded pictures, or screenshots are not permitted. If you experience any issues uploading an authentic photo, please contact our official support team at mementoserviceco@gmail.com.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "submit_problem"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "submit_ai": {
    "id": "submit_ai",
    "message": "Our AI analyzes your description, automatically assigns relevant tags (e.g., 'Water', 'Roads'), and categorizes the issue. If the AI detects a problem with similar tags in the same location, it may prevent a duplicate submission. In this case, please use the search bar in the 'Updates' section at the top of the site to search for your problem using different keywords, where you can choose to support the existing report. If you cannot find a matching problem, please send a detailed description of your issue along with the associated media to mementoserviceco@gmail.com. Our team will verify the submission. If it does not match an existing category, it will be posted, and you will be notified and granted access to the problem statement.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "submit_problem"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "submit_dupes": {
    "id": "submit_dupes",
    "message": "If the AI detects an existing problem within a 100-meter radius with similar tags, it will flag your submission as a duplicate and prompt you to support the existing issue instead. For more information, please click 'Go Back' and review the 'AI Auto-Categorization' option.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "submit_problem"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "submit_camera": {
    "id": "submit_camera",
    "message": "Did you know you don't even have to leave the app to take a picture of a problem? When you are filling out the submission form, instead of uploading a photo from your gallery, just click the Camera icon. This will open up our built-in camera tool. As long as you give your browser permission, you can snap a live photo of the pothole or broken pipe right then and there. It's the best way to ensure the photo is 100% genuine and helps the AI process it faster!",
    "options": [
      {
        "label": "Go Back",
        "nextId": "submit_problem"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "feed_issues": {
    "id": "feed_issues",
    "message": "The Feed is where all public issues live. What do you want to know?",
    "options": [
      {
        "label": "Sorting by \"Recent\" vs \"Supported\"",
        "nextId": "feed_sort"
      },
      {
        "label": "How Upvoting works",
        "nextId": "feed_upvote"
      },
      {
        "label": "Issue Status Definitions",
        "nextId": "feed_status"
      },
      {
        "label": "Filtering by District",
        "nextId": "feed_filter"
      },
      {
        "label": "Top Problems Filtering",
        "nextId": "feed_top_filter"
      },
      {
        "label": "Tracking Timeline (Like E-commerce)",
        "nextId": "feed_timeline"
      },
      {
        "label": "Go Back",
        "nextId": "root"
      }
    ]
  },
  "feed_top_filter": {
    "id": "feed_top_filter",
    "message": "When you click on 'Top Problems' in the navigation bar, you see the most heavily supported issues across the entire platform. But what if you only care about the biggest problems in your own city? No problem! Just like on the regular feed, you can use the sidebar to filter these top problems by District or Category. It’s a fantastic way to find the most critical 'Roads' or 'Healthcare' issues right in your own neighborhood so you can lend your support where it matters most!",
    "options": [
      {
        "label": "Go Back",
        "nextId": "feed_issues"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "feed_timeline": {
    "id": "feed_timeline",
    "message": "We know how frustrating it is when you report a problem and it just disappears into a black hole. That is why we built our issue tracking system to work just like tracking an online shopping order! When you click on any problem in your dashboard or the feed, you will see a visual timeline. It clearly shows exactly when the problem was reported, when it got assigned to a team, and the current progress being made. You will never be left in the dark about what the authorities are doing.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "feed_issues"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "feed_sort": {
    "id": "feed_sort",
    "message": "The 'Recent' filter displays uploads in chronological order. 'Top Supported' ranks issues based on their algorithmic support count. Similar to engagement metrics on social media platforms, supporting a problem statement boosts its reach. We encourage you to support problems you encounter regularly or care deeply about. You can also share problem statements to increase their visibility. Additionally, you can track the status of any problem by clicking on it and navigating to your dashboard.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "feed_issues"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "feed_upvote": {
    "id": "feed_upvote",
    "message": "Clicking the Thumbs Up icon registers your support for a problem. Similar to social media platforms, this action boosts the problem's priority score. Please note that you may only support a given post once. You can also share your posted problems or those you support to increase their reach. Furthermore, you can track the status of any problem by clicking on it and viewing it on your dashboard.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "feed_issues"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "feed_status": {
    "id": "feed_status",
    "message": "Whenever you want to know what's happening with a problem you or someone else reported, you can check its status tag right there on the feed. If it says 'PENDING', it means the issue is brand new and waiting to be reviewed. 'ROUTED' means we have sent it over to the correct government department. 'IN_PROGRESS' is great news—it means someone is actively working to fix it! Once the work is done, it changes to 'RESOLVED', and older fixed problems are eventually 'ARCHIVED'. You can always click on a problem to see these updates.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "feed_issues"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "feed_filter": {
    "id": "feed_filter",
    "message": "If the feed is looking a little too crowded and you only want to see problems in your own area or specific types of issues, you can easily filter them out! Just look at the left side of your screen when you are on the Feed page. There you will find a handy sidebar where you can choose your specific District, or pick categories like 'Roads', 'Water', or 'Healthcare'. This way, you only see the problems that matter most to you and your neighborhood.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "feed_issues"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "analytics": {
    "id": "analytics",
    "message": "The Statistics page renders macro-level data. Choose a chart:",
    "options": [
      {
        "label": "Top Data Boxes (Totals)",
        "nextId": "stat_boxes"
      },
      {
        "label": "Line Chart (6-Month Trend)",
        "nextId": "stat_line"
      },
      {
        "label": "Doughnut Chart (Current Spread)",
        "nextId": "stat_doughnut"
      },
      {
        "label": "Go Back",
        "nextId": "root"
      }
    ]
  },
  "stat_boxes": {
    "id": "stat_boxes",
    "message": "If you are curious about the big picture and want to see how much of a difference this platform is making, head over to the Statistics page. Right at the top, you will see a set of data boxes. These give you a quick, simple summary of everything going on. You can see the 'Total Lifetime Issues' (every problem ever reported), the 'Total Resolved' (how many we've successfully fixed), the number of issues that are 'Currently Active', and the overall 'Resolution Rate' percentage. It’s a great way to see our community's impact at a glance!",
    "options": [
      {
        "label": "Go Back",
        "nextId": "analytics"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "stat_line": {
    "id": "stat_line",
    "message": "If you want to see how well we are keeping up with the problems being reported over time, the Line Chart on the Statistics page is the perfect tool for you. Just scroll down a bit to find it. It shows a visual comparison of the volume of new issues being reported versus the ones being resolved over the last 6 months. It helps you see whether the authorities are catching up with the reports or falling behind during certain months.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "analytics"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "stat_doughnut": {
    "id": "stat_doughnut",
    "message": "To get a clear idea of what phase all the current active issues are in, take a look at the Doughnut Chart on the Statistics page. It takes all the unresolved problems and splits them into easy-to-read chunks. You can visually see how many problems are just sitting in 'Pending Review', how many have been 'Assigned' to a team, and what chunk is currently 'In Progress'. It gives you a great sense of where the workload is right now.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "analytics"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "triage": {
    "id": "triage",
    "message": "How does our platform prioritize problems? Select a mechanic:",
    "options": [
      {
        "label": "Support Count Cap",
        "nextId": "triage_cap"
      },
      {
        "label": "Urgency Multipliers",
        "nextId": "triage_urgency"
      },
      {
        "label": "Decay Mechanics",
        "nextId": "triage_decay"
      },
      {
        "label": "Go Back",
        "nextId": "root"
      }
    ]
  },
  "triage_cap": {
    "id": "triage_cap",
    "message": "We want to make sure the most critical problems get the attention they deserve, but we also have to prevent people from trying to manipulate the system by spamming upvotes. So, when you support a problem by clicking the Thumbs Up, it gains priority points. However, to keep things fair, a single problem can only gain a maximum of 10 bonus points from upvotes. This usually takes about 9 to 10 unique users supporting it. After that, it relies on its actual urgency to move up the queue.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "triage"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "triage_urgency": {
    "id": "triage_urgency",
    "message": "When you report a problem, it is very helpful to write a clear and accurate description of what is going on. Our AI system reads your description and automatically figures out what kind of problem it is. If the AI detects that your problem falls into a highly critical category—like 'Healthcare' emergencies or 'Fire' hazards—it will automatically multiply the problem's priority score by 1.5x. This ensures that the most dangerous problems get pushed to the top and handled much faster than less urgent issues.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "triage"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "triage_decay": {
    "id": "triage_decay",
    "message": "Sometimes a problem might sit open for a while without any institution taking action. If a problem has been open for more than 30 days without any updates, the system will slowly start to lower its priority score. This is called 'decay'. We do this so that older, possibly stalled issues do not permanently block the top of the list, ensuring that newer, urgent problems always get a chance to be seen and addressed by the authorities.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "triage"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "academic": {
    "id": "academic",
    "message": "Student volunteers can earn Academic Credits (AICTE/UGC mapping):",
    "options": [
      {
        "label": "How to log hours",
        "nextId": "acad_log"
      },
      {
        "label": "Validation Process",
        "nextId": "acad_validate"
      },
      {
        "label": "Exporting Credit Logs",
        "nextId": "acad_export"
      },
      {
        "label": "Go Back",
        "nextId": "root"
      }
    ]
  },
  "acad_log": {
    "id": "acad_log",
    "message": "If you are a student volunteer looking to log your hours, the first thing you need to do is go to the Institution Dashboard and join a project that says 'Team Formed'. Once you are officially part of that team, you don't need to worry about manually tracking your time! The system will automatically track your active contribution hours based on the project milestones you help complete. Just focus on doing the good work, and the platform will handle the logging for you.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "academic"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "acad_validate": {
    "id": "acad_validate",
    "message": "Logging your hours is just the first step! To actually convert those hard-earned hours into official academic credits, they need to go through a quick validation process to ensure everything is legitimate. You will need to make sure that both your supervising Professor and a designated Government Nodal Officer review your contributions. Once they both approve and validate your work, your hours will officially count as academic credits.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "academic"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "acad_export": {
    "id": "acad_export",
    "message": "Once you have successfully logged and validated your hours, you are ready to use them! You can reach out to your University Administrators, who have the ability to export all of your contribution logs. They will generate a secure, official PDF document containing all your hard work. You can then take this document and append it directly to your academic transcript as verified proof of your civic engagement and volunteer work.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "academic"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "roles": {
    "id": "roles",
    "message": "Are you a specific user type needing role guidance?",
    "options": [
      {
        "label": "Super Admin",
        "nextId": "role_admin"
      },
      {
        "label": "Institution Lead",
        "nextId": "role_inst"
      },
      {
        "label": "Student Volunteer",
        "nextId": "role_student"
      },
      {
        "label": "Go Back",
        "nextId": "root"
      }
    ]
  },
  "role_admin": {
    "id": "role_admin",
    "message": "If your account has Super Admin privileges, you will want to head straight over to the `#admin-dashboard`. This is your control center for keeping the platform running smoothly. From here, you have the power to clean up the system by purging or archiving old databases. You can also manually step in and override the AI's priority scores if it misjudged a problem, and you have the authority to ban any users who are breaking the rules or spamming the platform.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "roles"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "role_inst": {
    "id": "role_inst",
    "message": "If you are logging in as an Institution Lead, your main workspace will be the `#institution-dashboard`. This is where all the action happens for your organization! You can browse through the civic problems reported by the public and choose to bid on or 'adopt' the ones you want to fix. Once adopted, you can assign your student volunteers to form project teams. Finally, when the hard work is done, you can come back here to update the problem's status to 'RESOLVED'.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "roles"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "role_student": {
    "id": "role_student",
    "message": "If you are joining us as a Student Volunteer, welcome! Your home base will be the `#student-dashboard`. This is where you can see all the civic problems that institutions have decided to adopt. If you see a project that interests you, you can apply right there to join the team and help fix it. As you work on projects, you can use this same dashboard to easily track all the civic credit hours you have earned along the way.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "roles"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "nav_guide": {
    "id": "nav_guide",
    "message": "I can help you find your way around Memento. What are you looking for?",
    "options": [
      {
        "label": "Browsing Civic Issues",
        "nextId": "nav_browse"
      },
      {
        "label": "Submitting a New Issue",
        "nextId": "nav_submit"
      },
      {
        "label": "Data & Analytics",
        "nextId": "nav_data"
      },
      {
        "label": "About",
        "nextId": "nav_about"
      },
      {
        "label": "Dashboards & Login",
        "nextId": "nav_dashboards"
      },
      {
        "label": "Using the Search Bar",
        "nextId": "nav_search"
      },
      {
        "label": "Checking Notifications",
        "nextId": "nav_notifications"
      },
      {
        "label": "Using the Watchlist",
        "nextId": "nav_watchlist"
      },
      {
        "label": "Getting Started with the Community",
        "nextId": "nav_community_start"
      },
      {
        "label": "Go Back",
        "nextId": "root"
      }
    ]
  },
  "nav_browse": {
    "id": "nav_browse",
    "message": "If you want to look around and see what civic issues are currently happening in your area, just look at the top navigation bar and click on the 'Feed' option. It will show you a list of problems people have reported. If you are curious about the most critical issues that are getting a lot of attention, you can click on 'Top Problems' instead, which will show you the issues with the highest amount of community support.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "nav_guide"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "nav_submit": {
    "id": "nav_submit",
    "message": "Ready to report a problem you spotted in your neighborhood? It's super easy! Just look at the main navigation bar at the top of the site and click on 'Submit Problem'. If you want an even quicker way, just look for the floating '+' button located down in the bottom right corner of your screen. Clicking either of those will open up the form where you can give us the details and upload photos of the issue.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "nav_guide"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "nav_data": {
    "id": "nav_data",
    "message": "If you are the kind of person who loves looking at data and seeing how things are progressing, you should definitely check out our analytics. Just go to the top navigation bar and click on 'Statistics'. There you will find all sorts of charts and data boxes that break down how many problems are being reported, how many are getting fixed, and overall how the platform is performing.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "nav_guide"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "nav_about": {
    "id": "nav_about",
    "message": "If you are new here or just want to understand a bit more about what we do, we would love to share our story with you! Just head up to the top navigation bar and click on the 'About' link. It will take you to a page where you can read all about the Memento platform, our mission to improve communities, and exactly how the whole system comes together to solve real-world civic problems.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "nav_guide"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "nav_dashboards": {
    "id": "nav_dashboards",
    "message": "To get the most out of the platform and access your own personalized workspace, you will need to sign in. Just look at the top right corner of your screen and click the 'Login' button. Enter your registered email and password. Once you successfully log in, don't worry about trying to find your way around—the system will automatically redirect you straight to your specific dashboard, whether you are a student, an institution, or an admin.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "nav_guide"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "nav_search": {
    "id": "nav_search",
    "message": "If you are looking for something very specific and don't want to scroll through the whole Feed, the Search Bar is your best friend! You can usually find it right at the top of the screen. Just type in some keywords—like 'pothole on Main Street' or 'broken streetlight'—and hit enter. The system will instantly filter through all the reported problems and show you exactly what you are looking for. It's a massive time-saver if you want to support a problem you already know about.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "nav_guide"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "nav_notifications": {
    "id": "nav_notifications",
    "message": "Ever wonder if a problem you reported finally got fixed? You don't have to guess! Just look for the little Bell icon at the top of your screen. That is your Notifications center. Whenever a problem you submitted gets assigned to a team, changes its status to 'In Progress', or finally gets 'Resolved', a little red dot will appear on the bell. Click it to see all your recent updates and never miss out on the good news happening in your community.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "nav_guide"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "nav_watchlist": {
    "id": "nav_watchlist",
    "message": "Found a problem that you care about, but you don't necessarily want to upvote or share it just yet? You can add it to your Watchlist! Look for the little bookmark or 'Watch' icon on any problem statement. Once you click it, the problem is saved to a special 'Watchlist' section in your personal dashboard. This lets you easily keep an eye on how it progresses without having to search for it again. It's like having a personal folder for the issues you care about most.",
    "options": [
      {
        "label": "Go Back",
        "nextId": "nav_guide"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  },
  "nav_community_start": {
    "id": "nav_community_start",
    "message": "Memento isn't just about fixing potholes—it's about building a better community together! If you want to get more involved, click on 'Community' in the top navigation bar. Here, you can see leaderboards of the most active volunteers, check out your own Trust Score, and interact with other citizens who are passionate about the same causes. The best way to get started is simply by leaving a helpful comment on a problem or sharing an important issue to your social media!",
    "options": [
      {
        "label": "Go Back",
        "nextId": "nav_guide"
      },
      {
        "label": "Main Menu",
        "nextId": "root"
      }
    ]
  }
};
