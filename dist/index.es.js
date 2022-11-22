import path from 'path';
import { rollup } from 'rollup';

const build = () => {
    rollup({
        input: path.resolve('../'),
    });
};

export { build };
