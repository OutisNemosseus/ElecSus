/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  libsSidebar: [
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
