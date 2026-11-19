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

const project = (id, name, url = null, image = null) => ({
  id,
  name,
  category: null,
  description: null,
  role: null,
  tech: [],
  url,
  image,
});

export const projects = [
  project('leadzsoft', 'LeadzSoft', 'https://leadzsoft.co/', '/images/projects/leadzsoft.webp'),
  project('reflax', 'Reflax', 'https://reflax.org/', '/images/projects/reflax.webp'),
  project('ecoxent', 'Ecoxent', 'https://ecoxent.com/', '/images/projects/ecoxent.webp'),
  project('gulzar-sons-furniture', 'GulzarSonsFurniture', 'https://gulzarsonsfurniture.com/', '/images/projects/gulzar-sons-furniture.webp'),
  project('brightgate', 'Brightgate', 'https://brightgate.ae/', '/images/projects/brightgate.webp'),
  project('aipilot-ai', 'AIPilot.ai', 'https://aipilot.io/', '/images/projects/aipilot.webp'),
  project('jmc-cleanup-services', 'JMC Cleanup Services', 'https://jmccleanup.com.au/', '/images/projects/jmc-cleanup.webp'),
  project('all-roofing-calculators', 'All Roofing Calculators', 'https://alltypescalculators.online/', '/images/projects/all-types-calculators.webp'),
];
