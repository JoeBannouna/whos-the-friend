import { animated } from '@react-spring/web';
import type { PlayerData } from '../types';

function PlayerPfp({
  player,
  mode = 'normal',
  anim = undefined,
}: {
  player: PlayerData;
  mode?: 'small' | 'normal' | 'big';
  anim?: any;
}) {
  const playerName = player.name;

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

    let customStyles = anim;
    if (player.color)
      customStyles = { ...anim, backgroundColor: player.color.bg, color: player.color.text };
    const backupPlayerTheme = player.color ? '' : 'bg-gray-400 text-gray-800';

    return (
      <animated.div
        className={`rounded-full relative ${backupPlayerTheme} flex justify-center items-center font-medium ${styles}`}
        style={customStyles}
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
