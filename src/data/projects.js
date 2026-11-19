// Habib's project list. ONLY the names are verified.
//
// Every other field is intentionally empty (null) and is shown as a clearly
// labelled placeholder on the site. Do not guess descriptions, results or
// technologies. Fill them in only with verified information:
//
//   category    short label, e.g. 'E-commerce'
//   description one or two honest sentences about the project
//   role        what you did on it
//   tech        array of technologies actually used
//   url         live site URL
//   image       screenshot path, e.g. '/images/projects/leadzsoft.webp'
//
// A project card stops showing "Placeholder" once `description` is filled in.

const project = (id, name, url = null) => ({
  id,
  name,
  category: null,
  description: null,
  role: null,
  tech: [],
  url,
  image: null,
});

export const projects = [
  project('leadzsoft', 'LeadzSoft'),
  project('reflax', 'Reflax'),
  project('ecoxent', 'Ecoxent'),
  project('gulzar-sons-furniture', 'GulzarSonsFurniture'),
  project('brightgate', 'Brightgate'),
  project('aipilot-ai', 'AIPilot.ai'),
  project('jmc-cleanup-services', 'JMC Cleanup Services', 'https://jmccleanup.com.au/'),
  project('all-roofing-calculators', 'All Roofing Calculators', 'https://alltypescalculators.online/'),
];
