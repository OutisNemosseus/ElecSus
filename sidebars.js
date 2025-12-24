/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  libsSidebar: [
    {
      type: 'category',
      label: 'PDF & LaTeX Docs',
      link: {
        type: 'doc',
        id: 'inbox/index',
      },
      items: [
        'inbox/AtomConstants',
        'inbox/BasisChanger',
        'inbox/EigenSystem',
        'inbox/FundamentalConstants',
        'inbox/JonesMatrices',
        'inbox/MLFittingRoutine',
        'inbox/ang_mom',
        'inbox/ang_mom_p',
        'inbox/data_proc',
        'inbox/durhamcolours',
        'inbox/fs_hfs',
      ],
    },
    {
      type: 'category',
      label: 'Library Reference',
      link: {
        type: 'doc',
        id: 'libs/index',
      },
      items: [
        {
          type: 'category',
          label: 'Core Modules',
          items: [
            'libs/spectra',
            'libs/EigenSystem',
            'libs/solve_dielectric',
          ],
        },
        {
          type: 'category',
          label: 'Physical Constants',
          items: [
            'libs/AtomConstants',
            'libs/FundamentalConstants',
            'libs/numberDensityEqs',
          ],
        },
        {
          type: 'category',
          label: 'Angular Momentum',
          items: [
            'libs/ang_mom',
            'libs/ang_mom_p',
            'libs/sz_lsi',
            'libs/fs_hfs',
          ],
        },
        {
          type: 'category',
          label: 'Optics & Polarization',
          items: [
            'libs/JonesMatrices',
            'libs/BasisChanger',
            'libs/RotationMatrices',
          ],
        },
        {
          type: 'category',
          label: 'Fitting Routines',
          items: [
            'libs/MLFittingRoutine',
            'libs/RRFittingRoutine',
            'libs/SAFittingRoutine',
          ],
        },
        {
          type: 'category',
          label: 'Utilities',
          items: [
            'libs/data_proc',
            'libs/durhamcolours',
            'libs/preamble',
          ],
        },
      ],
    },
  ],
};

module.exports = sidebars;
