import "./style.scss";

export default function LayoutContainer() {
  return (
    <div className="layoutContainer">
      <div className="layoutHeader">
        <p className="layoutHeaderText">Layout</p>
      </div>
      <div className="layoutGrid">
        <button className="layoutIconBtn" title="2-column">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
          >
            <g clipPath="url(#clip0_905_24515)">
              <path
                d="M9.75 10.5H6C5.17157 10.5 4.5 11.1716 4.5 12V13.5C4.5 14.3284 5.17157 15 6 15H9.75C10.5784 15 11.25 14.3284 11.25 13.5V12C11.25 11.1716 10.5784 10.5 9.75 10.5Z"
                stroke="#606E80"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 3H6C5.17157 3 4.5 3.67157 4.5 4.5V6C4.5 6.82843 5.17157 7.5 6 7.5H15C15.8284 7.5 16.5 6.82843 16.5 6V4.5C16.5 3.67157 15.8284 3 15 3Z"
                stroke="#606E80"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M1.5 1.5V16.5"
                stroke="#606E80"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_905_24515">
                <rect width="18" height="18" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </button>
        <button className="layoutIconBtn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
          >
            <path
              d="M9 1.5V16.5"
              stroke="#606E80"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6 7.5H3C2.60218 7.5 2.22064 7.34196 1.93934 7.06066C1.65804 6.77936 1.5 6.39782 1.5 6V4.5C1.5 3.675 2.175 3 3 3H6"
              stroke="#606E80"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 7.5H15C15.3978 7.5 15.7794 7.34196 16.0607 7.06066C16.342 6.77936 16.5 6.39782 16.5 6V4.5C16.5 4.10218 16.342 3.72064 16.0607 3.43934C15.7794 3.15804 15.3978 3 15 3H12"
              stroke="#606E80"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6 15H5.25C4.85218 15 4.47064 14.842 4.18934 14.5607C3.90804 14.2794 3.75 13.8978 3.75 13.5V12C3.75 11.175 4.425 10.5 5.25 10.5H6"
              stroke="#606E80"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 10.5H12.75C13.1478 10.5 13.5294 10.658 13.8107 10.9393C14.092 11.2206 14.25 11.6022 14.25 12V13.5C14.25 13.8978 14.092 14.2794 13.8107 14.5607C13.5294 14.842 13.1478 15 12.75 15H12"
              stroke="#606E80"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button className="layoutIconBtn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
          >
            <g clipPath="url(#clip0_905_24525)">
              <path
                d="M12 3H3C2.17157 3 1.5 3.67157 1.5 4.5V6C1.5 6.82843 2.17157 7.5 3 7.5H12C12.8284 7.5 13.5 6.82843 13.5 6V4.5C13.5 3.67157 12.8284 3 12 3Z"
                stroke="#606E80"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 10.5H8.25C7.42157 10.5 6.75 11.1716 6.75 12V13.5C6.75 14.3284 7.42157 15 8.25 15H12C12.8284 15 13.5 14.3284 13.5 13.5V12C13.5 11.1716 12.8284 10.5 12 10.5Z"
                stroke="#606E80"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16.5 16.5V1.5"
                stroke="#606E80"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_905_24525">
                <rect width="18" height="18" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </button>
        <button className="layoutIconBtn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
          >
            <g clipPath="url(#clip0_905_24529)">
              <path
                d="M6 1.5H4.5C3.67157 1.5 3 2.17157 3 3V12C3 12.8284 3.67157 13.5 4.5 13.5H6C6.82843 13.5 7.5 12.8284 7.5 12V3C7.5 2.17157 6.82843 1.5 6 1.5Z"
                stroke="#606E80"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.5 6.75H12C11.1716 6.75 10.5 7.42157 10.5 8.25V12C10.5 12.8284 11.1716 13.5 12 13.5H13.5C14.3284 13.5 15 12.8284 15 12V8.25C15 7.42157 14.3284 6.75 13.5 6.75Z"
                stroke="#606E80"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16.5 16.5H1.5"
                stroke="#606E80"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_905_24529">
                <rect width="18" height="18" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </button>
        <button className="layoutIconBtn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
          >
            <path
              d="M1.5 9H16.5"
              stroke="#606E80"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7.5 12V15C7.5 15.3978 7.34196 15.7794 7.06066 16.0607C6.77936 16.342 6.39782 16.5 6 16.5H4.5C4.10218 16.5 3.72064 16.342 3.43934 16.0607C3.15804 15.7794 3 15.3978 3 15V12"
              stroke="#606E80"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7.5 6V3C7.5 2.60218 7.34196 2.22064 7.06066 1.93934C6.77936 1.65804 6.39782 1.5 6 1.5H4.5C4.10218 1.5 3.72064 1.65804 3.43934 1.93934C3.15804 2.22064 3 2.60218 3 3V6"
              stroke="#606E80"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15 12V12.75C15 13.1478 14.842 13.5294 14.5607 13.8107C14.2794 14.092 13.8978 14.25 13.5 14.25H12C11.6022 14.25 11.2206 14.092 10.9393 13.8107C10.658 13.5294 10.5 13.1478 10.5 12.75V12"
              stroke="#606E80"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10.5 6V5.25C10.5 4.425 11.175 3.75 12 3.75H13.5C13.8978 3.75 14.2794 3.90804 14.5607 4.18934C14.842 4.47064 15 4.85218 15 5.25V6"
              stroke="#606E80"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button className="layoutIconBtn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
          >
            <g clipPath="url(#clip0_905_24539)">
              <path
                d="M6 4.5H4.5C3.67157 4.5 3 5.17157 3 6V15C3 15.8284 3.67157 16.5 4.5 16.5H6C6.82843 16.5 7.5 15.8284 7.5 15V6C7.5 5.17157 6.82843 4.5 6 4.5Z"
                stroke="#606E80"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.5 4.5H12C11.1716 4.5 10.5 5.17157 10.5 6V9.75C10.5 10.5784 11.1716 11.25 12 11.25H13.5C14.3284 11.25 15 10.5784 15 9.75V6C15 5.17157 14.3284 4.5 13.5 4.5Z"
                stroke="#606E80"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16.5 1.5H1.5"
                stroke="#606E80"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_905_24539">
                <rect width="18" height="18" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </button>
      </div>
    </div>
  );
}
