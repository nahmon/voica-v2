/** Screen-name → URL path mapping for React Router migration */
export const ROUTES = {
  landing:          "/",
  advertiser_login: "/login",
  role_select:      "/role-select",
  dashboard:        "/dashboard",
  editor:           "/editor",
  panel_entry:      "/panel/join",
  panel_mypage:     "/panel/mypage",
  panel_board:      "/panel",
  consent:          "/consent",
  interview:        "/i",
  report:           "/report",
  responses:        "/responses",
  recruiter_admin:  "/admin",
  pricing:          "/pricing",
  support:          "/support",
  faq:              "/faq",
  terms:            "/terms",
  privacy:          "/privacy",
  about:            "/about",
};

/** Screens that take an :id param (interviewId) */
export const ID_SCREENS = new Set(["editor", "report", "responses"]);

/** Screen that takes a :code param (shareCode) */
export const CODE_SCREEN = "interview";
