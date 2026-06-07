import { animated } from '@react-spring/web';

function PlayerPfp({
  playerName,
  mode = 'normal',
  anim = undefined,
}: {
  playerName: string;
  mode?: 'small' | 'normal' | 'big';
  anim?: any;
}) {
  if (playerName.length > 0) {
    const names = playerName.split(' ');
    const name =
      names.length > 1
        ? names
            .map((n: string) => n[0])
            .filter((_v, i) => i < 2)
            .join('')
        : playerName[0] + playerName[1];

    let styles = '';

    switch (mode) {
      case 'normal':
        styles = 'w-9 h-9 text-base';
        break;

      case 'small':
        styles = 'w-8 h-8 border-2 border-white text-xs';
        break;

      case 'big':
        styles = 'z-40 w-32 h-32 border-4 border-white text-5xl';
        break;

      default:
        break;
    }

    return (
      <animated.div
        className={`rounded-full relative bg-gray-400 text-gray-800 flex justify-center items-center font-medium ${styles}`}
        style={anim}
      >
        {name.toLocaleUpperCase()}
        {mode == 'big' ? <div className="absolute top-0 -right-1/5">🏆</div> : null}
      </animated.div>
    );
  }

  return (
    <div className="w-9 h-9 rounded-full text-base bg-gray-400 text-gray-800 flex justify-center items-center font-medium"></div>
  );
}

export default PlayerPfp;
