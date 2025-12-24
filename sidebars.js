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
        {
          type: 'category',
          label: 'PDF Documents',
          items: [
            'inbox/AtomConstants_pdf',
            'inbox/BasisChanger_pdf',
            'inbox/EigenSystem_pdf',
            'inbox/FundamentalConstants_pdf',
            'inbox/JonesMatrices_pdf',
            'inbox/MLFittingRoutine_pdf',
            'inbox/ang_mom_pdf',
            'inbox/ang_mom_p_pdf',
            'inbox/data_proc_pdf',
            'inbox/durhamcolours_pdf',
            'inbox/fs_hfs_pdf',
          ],
        },
        {
          type: 'category',
          label: 'LaTeX Sources',
          items: [
            'inbox/AtomConstants_tex',
            'inbox/BasisChanger_tex',
            'inbox/EigenSystem_tex',
            'inbox/FundamentalConstants_tex',
            'inbox/JonesMatrices_tex',
            'inbox/MLFittingRoutine_tex',
            'inbox/ang_mom_tex',
            'inbox/ang_mom_p_tex',
            'inbox/data_proc_tex',
            'inbox/durhamcolours_tex',
            'inbox/fs_hfs_tex',
          ],
        },
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
