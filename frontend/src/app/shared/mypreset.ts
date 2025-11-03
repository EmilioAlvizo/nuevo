// nuevo/frontend/src/app/shared/mypreset.ts
import { definePreset } from '@primeuix/themes';
import Lara from '@primeuix/themes/lara';

const MyPreset = definePreset(Lara, {
    components: {
        datatable: {
            css: () => `
                .p-datatable {
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    /*overflow: hidden;*/
                }

            `
        }
    }
});

export default MyPreset;