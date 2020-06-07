module.exports = {
  siteTitle: 'Tyler Riedal | Software Consultant',
  siteDescription:
    'Tyler Riedal is a software consultant based in Saint Petersburg, FL who specializes in building exceptional websites, applications, and everything in between.',
  siteKeywords:
    'Tyler Riedal, Tyler, Riedal, software engineer, front-end engineer, web developer, javascript, northeastern',
  siteUrl: 'https://www.bluehelixsoftware.com',
  siteLanguage: 'en_US',
  // googleAnalyticsID: 'UA-45666519-2',
  // googleVerification: 'DCl7VAf9tcz6eD9gb67NfkNnJ1PKRNcg8qQiwpbx9Lk',
  name: 'Tyler Riedal',
  location: 'Saint Petersburg, FL',
  email: 'riedalsolutions@gmail.com',
  github: 'https://github.com/triedal',
  // twitterHandle: '@bchiang7',
  socialMedia: [
    {
      name: 'GitHub',
      url: 'https://github.com/triedal',
    },
    {
      name: 'Linkedin',
      url: 'https://www.linkedin.com/in/tylerriedal/',
    },
    // {
    //   name: 'Codepen',
    //   url: 'https://codepen.io/bchiang7',
    // },
    // {
    //   name: 'Instagram',
    //   url: 'https://www.instagram.com/bchiang7',
    // },
    // {
    //   name: 'Twitter',
    //   url: 'https://twitter.com/bchiang7',
    // },
  ],

  navLinks: [
    {
      name: 'About',
      url: '/#about',
    },
    {
      name: 'Experience',
      url: '/#jobs',
    },
    {
      name: 'Work',
      url: '/#projects',
    },
    {
      name: 'Contact',
      url: '/#contact',
    },
  ],

  navHeight: 100,

  colors: {
    green: '#64ffda',
    navy: '#0a192f',
    darkNavy: '#020c1b',
  },

  srConfig: (delay = 200) => ({
    origin: 'bottom',
    distance: '20px',
    duration: 500,
    delay,
    rotate: { x: 0, y: 0, z: 0 },
    opacity: 0,
    scale: 1,
    easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    mobile: true,
    reset: false,
    useDelay: 'always',
    viewFactor: 0.25,
    viewOffset: { top: 0, right: 0, bottom: 0, left: 0 },
  }),
};
