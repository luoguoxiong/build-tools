import chalk from 'chalk';

const colors = [
  'blue',
  'magenta',
  'gray',
  'redBright',
  'greenBright',
  'yellowBright',
  'blueBright',
  'magentaBright',
  'cyanBright',
];
export const getChalkInstance = (() => {
  let index = 0;
  return () => {
    index = index % (colors.length - 1);
    const color = colors[index];
    index++;
    return chalk[color];
  };
})();
