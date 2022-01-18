import React from 'react'

export const onRenderBody = ({ setHeadComponents }) => {
  setHeadComponents([
    <script
      key='$script$'
      dangerouslySetInnerHTML={{
        __html: `
          (() => {
            const theme = localStorage.getItem('theme') || 'light'

            document.documentElement.setAttribute('theme', theme)
          })()
        `
      }} />
  ]);
};
