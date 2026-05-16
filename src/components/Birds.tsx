'use client';

import { useEffect } from 'react';

const TWEETS = [
  '¡No olvides mi regalo!',
  '¡Saludos!',
  'Me gusta el color rosa',
  '¡Qué bonita invitación!',
  '¡Nos vemos pronto!',
  '¡Será una fiesta increíble!',
  '¡Ya quiero bailar!',
  '¡Feliz cumpleaños Alana!',
  'tweet tweet~',
  '¡Que viva la cumpleañera!',
];

// Full bird CSS injected at runtime — bypasses any Tailwind cascade interference.
// Uses original class names (.head, .body, .wing, etc.) scoped under .bird-wrapper.
const BIRD_CSS = `
.bird-wrapper {
  position: absolute;
  z-index: 9999;
  top: 0; left: 0;
  overflow: visible;
  pointer-events: none;
}
.bird-wrapper .bird {
  position: absolute;
  --m: 2; --w: 21px; --h: 18px;
  width: calc(var(--m) * var(--w));
  height: calc(var(--m) * var(--h));
  margin-top: calc(var(--m) * var(--h) * -0.5);
  margin-left: calc(var(--m) * var(--w) * -0.5);
  --flip: scale(1);
}
/* Head */
.bird-wrapper .head {
  position: absolute;
  --w: 19px; --h: 15px;
  width: calc(var(--m) * var(--w));
  height: calc(var(--m) * var(--h));
  background-size: calc(var(--m) * var(--w) * 5) calc(var(--m) * var(--h) * 6);
  background-repeat: no-repeat;
  image-rendering: pixelated;
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAF8AAABaCAYAAADegYpGAAAAAXNSR0IArs4c6QAABYlJREFUeF7tXVF2FDEM6/7DfeA0cDQ4DdwH/peX95piTBJJjjOz3Uk/O7NaW1YSR5NOby/75zQGbqd98xN/8ZdPH+7ff/6G3A5vuN/vd8/R7XaDoI/OK0tONA8Wv0lki/SsInjsaDFnhVEIKjlVhc7iFSwV4z/yGeJrIRTiEC6LhXBKbAxWIf/bj1+UuBFeNKZ/yGdAIiOAxc1IkhUGGxMq5gzOcvKV4DITHWHZmL5+/vjCjICWMNTcfExv5EeAGJWpuD31qziXJz9CmCWtLpled16dRyvWFzOam8VpKh8l5q9nqtUnWQuwyX+dZ2bJR8XNml97U09UtTauKEZT+b0+tfx+RNaoQykBtj4bwYski2Kj+szXm7IEYXHgJqsQVX/s0EdtYfnMaM62iTNYI3FE2l8Wj4mNEUYLh7IK2O2yoqR978sLRf4mag0Dm/w1vFKom3yKpthNaLq+pKVsqUQExWj/22yMfH3Y7fS+nOkC/GdVy3WUeBbWyN1cneNlLWW21ext1BhhoXZ6uauZmSTTT9eEkWorFtptI/JnYlpOvhJcZqIsFkN+D0vNzeNc3lJWFlQ/mh6a/EhwXh2XczUZNdjhuspSvqSfX8hHc+Es+aqzmTGKqqgysKIYdmR3F1xPTo8sxrZVbOXMUcTExozy5QuuDaJV1WotV1sZtXJWZf6zrYQVPETY0VjMKAhbyjXZyFY88hlE7rNc38baiZXc5G/yT2TgxK++vKWczb2yxh1qKbdMNrYzaZEUtZU9Qb1uRY1NjecpLWVkqpXr+5SykzNSGtNPW8isTdYqnHdjKavEj9SvePm1mEsPTUWSGwUW9VFskuyhq9GiOSIN+VdoFEU5qzHtg7JCu7PsrKatIjLVZg/KIteUGeKsahkslv9DyLfB9M5qoiFp28qWsbYtZXdcMDKHoU6AcTSZQrb2CEixKDb0eRTXLF/LN1lMgKjFtCRk4mVhRXG2sabIP/neTX4yoQrcJl9hK/neTX4yodOu5mh3qiyOyXmlwikkKV+s4C7vdnzgvjOIFlO1b30c+8UXhhG2CNG2zpLfOwXXUziKLRrTcldT2RxlJFkJPAqLIb4X03LyleBKkKt3pV4MR3tENr/Ln1J+WvJV1fvhecmDskgNGZbyqH3zU0/reSuKcTT3z4pCWcdaeUoPU5C/rx5uRcT5p1nlL/oyCBvtX5hefpmf36tmJSpySjnyhw1qIZURpLqj9v6shzLNBbcXWI981MpZlSlKH5HJql+JDSmewWLiauFQ3o6yZW7tJJkXfCISnvE6Rf4zJv4IOW3yT6zC5cmfmVJHdWNwL3tKuZLDkKQODu+Ydg271oXo6o2CnLWBUavIdCYWA7mbKl6vXe/hPOUpZZY0RmTI7GM3brDVZINBmw8/AlhcRBqLwxCmHJbNclo9ziUtZTs9oA1gFdLSHa6iKq/sLGWMFBuJL9OqaMU2G9NSPz8SnE3ykpYy6lrK9dl3L4y+49KWsie3RdQs+ewp5dqHz44i1KYygjvMUm55+DVA9rW+o45Ctagj5K9ei2Zjos/tsE+vWm0mc0wctZlsP820mdlYTBFgn4+GXmQrvnIbj+J99OuXN9bOLNAm/0T2N/nJ5CtT82Ut5WTO3+CmyY+u3kxCWaeUrT+jGn37xReuUpmtJtNu7hdfiAVgRiQzChTiUSGVmN6VpWynByXJWgDkarJ2cq8AszEtdTV787JqqpX7mf9f2MId+fBnkG8L+fAvvijB7oOy5n/Hsj5PGZY9dc26mqxqs55A+aknMuX46RBOO+ig7GhBsq6mnzpY8hUTTJ12mNa4t4Cnkj+an1WiPGGsSjM7iyOwIgWQTin31MH25Uxbx2KxCziLx5DHYEVxtrejzj2J92/yE8lUof4AX4lUtcFJ+m8AAAAASUVORK5CYII=);
  top: calc(var(--m) * -2px);
  left: calc(var(--m) * 1px);
  z-index: 2;
  --tweet-offset: 0;
  --bw: 0;
  --bh: calc(0 - var(--tweet-offset));
  background-position: calc(var(--m) * var(--w) * var(--bw)) calc(var(--m) * var(--h) * var(--bh));
}
.bird-wrapper.pos-1 .head { --bh: calc(0  - var(--tweet-offset)); }
.bird-wrapper.pos-2 .head { --bh: calc(-1 - var(--tweet-offset)); }
.bird-wrapper.pos-3 .head { --bh: calc(-2 - var(--tweet-offset)); }
/* Body */
.bird-wrapper .body {
  position: absolute;
  --w: 21px; --h: 14px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAOCAYAAADABlfOAAAAAXNSR0IArs4c6QAAAFlJREFUOE9jZKABYMRl5v////8Tso+RkRGrfgxBYgxDtwzdcBRDyTEQZgGywXBDKTEQ3WDaGUoNVyK7FuzSEW4otYIAlqxom06RcwkpEYctq+LM+4TyPT55AEJ+MA89Jl+CAAAAAElFTkSuQmCC);
  width: calc(var(--m) * var(--w));
  height: calc(var(--m) * var(--h));
  background-size: cover;
  top: calc(var(--m) * 5px);
  z-index: 1;
}
/* Wings */
.bird-wrapper .wing {
  position: absolute;
  width: 0px; height: 0px;
  top: calc(var(--m) * 9px);
  display: flex;
  align-items: center;
  z-index: 2;
}
.bird-wrapper .wing::after {
  position: absolute;
  content: '';
  --w: 7px; --h: 4px;
  background-size: cover;
  image-rendering: pixelated;
  width: calc(var(--m) * var(--w));
  height: calc(var(--m) * var(--h));
}
.bird-wrapper.up .wing::after,
.bird-wrapper.down .wing::after {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAECAYAAABCxiV9AAAANklEQVR4AUzJsQ0AIAwDQXDNQGzDbGzDQPSgRxQfyZFzSfkzejsO/J4gh4OFZXTPXLsSIx27AAAA///Y5+gzAAAABklEQVQDAEQqEpFoMrQzAAAAAElFTkSuQmCC);
}
.bird-wrapper .right-wing { right: calc(var(--m) * 2px); --f: -1; justify-content: start; }
.bird-wrapper .right-wing::after { transform: scale(-1, 1); }
.bird-wrapper .left-wing { left: calc(var(--m) * 2px); --f: 1; justify-content: end; }
.bird-wrapper.fly .left-wing { left: calc(var(--m) * 3px); }
.bird-wrapper.fly .right-wing { right: calc(var(--m) * 3px); }
.bird-wrapper.up .wing,
.bird-wrapper.down .wing {
  --wing-start: rotate(calc(-45deg * var(--f)));
  --wing-end: rotate(calc(45deg * var(--f)));
  transform: rotate(calc(-90deg * var(--f)));
}
.bird-wrapper.fly.up .wing,
.bird-wrapper.fly.down .wing { animation: brd-wing-flap infinite 0.2s; }
.bird-wrapper.fly.up .wing::after,
.bird-wrapper.fly.down .wing::after {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAGCAYAAAD68A/GAAAAAXNSR0IArs4c6QAAADZJREFUGFdjZEAD8RY8/5GFFp74wgjigwkQQFeArhisEJ8imAZGYhTBrSakGOROuBtxOQHmGQAV0hNL7bdGpQAAAABJRU5ErkJggg==);
  --w: 10px; --h: 6px;
}
.bird-wrapper.fly.d-up .left-wing::after,
.bird-wrapper.fly.side .left-wing::after,
.bird-wrapper.fly.d-down .left-wing::after {
  animation: brd-wing-flap-side infinite 0.2s steps(1);
  --w: 9px;
  z-index: 1;
}
.bird-wrapper.fly.down .wing { z-index: 0; }
/* Legs */
.bird-wrapper .legs {
  position: absolute;
  bottom: 0; --h: 2px;
  width: calc(var(--m) * var(--w));
  height: calc(var(--m) * var(--h));
  justify-content: space-between;
  padding: 0 calc(var(--m) * 5px);
  display: none;
}
.bird-wrapper.down .legs { display: flex; }
.bird-wrapper.up .legs { z-index: 0; }
.bird-wrapper .leg {
  background-color: #5f380c;
  --w: 1px; --h: 3px;
  width: calc(var(--m) * var(--w));
  height: calc(var(--m) * var(--h));
  z-index: 1;
}
/* Head direction */
.bird-wrapper.up    .head { --bw: -4; }
.bird-wrapper.d-up  .head { --bw: -3; left: calc(var(--m) * -1px); }
.bird-wrapper.side  .head { --bw: -2; left: calc(var(--m) * -1px); }
.bird-wrapper.d-down .head { --bw: -1; left: calc(var(--m) * -1px); }
.bird-wrapper.down  .head { --bw: 0; }
/* Flip for right-facing */
.bird-wrapper.right .bird { transform: scale(-1, 1); --flip: scale(-1, 1); }
/* Wing positions per direction */
.bird-wrapper.side .left-wing { left: calc(var(--m) * 6px); top: calc(var(--m) * 10px); z-index: 2; }
.bird-wrapper.side .left-wing::after {
  --w: 10px; --h: 6px;
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAGCAYAAAD68A/GAAAAAXNSR0IArs4c6QAAADdJREFUGFdjZICCeAue/zA2iF544gsjMh/MQVeETQMjPkUwDSDTiVII0kDQaph74Q7G5gRkDwEAhlgVqe4XPiwAAAAASUVORK5CYII=);
}
.bird-wrapper.d-up .left-wing { left: calc(var(--m) * 2px); top: calc(var(--m) * 11px); z-index: 2; }
.bird-wrapper.d-up .left-wing::after {
  --w: 8px; --h: 7px;
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAHCAYAAAA1WQxeAAAAAXNSR0IArs4c6QAAADhJREFUGFdjZGBgYIi34PkPomFg4YkvjDA2I7okuiKcCkAKQSYRVoDNDcjugTsGl1vgCmC60BUCAEivFO6lToiVAAAAAElFTkSuQmCC);
  z-index: 2;
}
.bird-wrapper.side .left-wing,
.bird-wrapper.d-down .left-wing,
.bird-wrapper.d-up .left-wing { justify-content: start; align-items: start; }
.bird-wrapper.d-down .left-wing { left: calc(var(--m) * 11px); top: calc(var(--m) * 11px); }
.bird-wrapper.d-down .left-wing::after { --w: 8px; --h: 6px; }
.bird-wrapper.d-down .wing::after {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAGCAYAAAD+Bd/7AAAAAXNSR0IArs4c6QAAACxJREFUGFdjZEAC8RY8/2HchSe+MILYYAJZAlkDWAE+SZAp5CvA6waYJMgNANQvFamdLq05AAAAAElFTkSuQmCC);
  z-index: 2;
}
.bird-wrapper.d-down .right-wing,
.bird-wrapper.d-up .right-wing,
.bird-wrapper.side .right-wing { display: none; }
/* Hop */
.bird-wrapper.hop .bird {
  --bop-start: 0px; --bop-middle: calc(var(--m) * -1px); --bop-end: 0px;
  animation: brd-bop infinite 0.2s;
}
/* Fly arc */
.bird-wrapper.fly .bird {
  --bop-start: -100px; --bop-middle: -10px; --bop-end: 0px;
  animation: brd-fly-arc forwards 2s ease-in-out;
}
/* Tweet */
.bird-wrapper.tweet .head { animation: brd-tweet infinite 0.2s steps(2); }
@keyframes brd-tweet {
  0%   { --tweet-offset: 3; }
  100% { --tweet-offset: 0; }
}
/* Tail */
.bird-wrapper .tail {
  position: absolute;
  image-rendering: pixelated;
  --m: 2;
  background-repeat: no-repeat;
  background-size: cover;
  width: calc(var(--m) * var(--w));
  height: calc(var(--m) * var(--h));
}
.bird-wrapper.up .tail {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGCAYAAAAL+1RLAAAAAXNSR0IArs4c6QAAACZJREFUGFdjZICCeAue/wtPfGEEccEESAAmCZJgRBaASZAgiM1MAHf4EO3J5G9wAAAAAElFTkSuQmCC);
  --w: 5px; --h: 6px;
  left: calc(var(--m) * 8px); top: calc(var(--m) * 15px); z-index: 1;
}
.bird-wrapper.side .tail {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAACCAYAAACUn8ZgAAAAAXNSR0IArs4c6QAAABdJREFUGFdjjLfg+c+AAzDiklx44gsjAIuGBaUigwNFAAAAAElFTkSuQmCC);
  --w: 7px; --h: 2px;
  left: calc(var(--m) * 19px); top: calc(var(--m) * 12px);
}
.bird-wrapper.hop .tail,
.bird-wrapper.d-down .tail {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAGCAYAAAAPDoR2AAAAAXNSR0IArs4c6QAAADRJREFUGFdjZEAD8RY8/0FCC098YWREloNJwMTgkugScJ3YJEC6GZElQKqRrYFLokuAFAEA55wVqU/qlJAAAAAASUVORK5CYII=);
  --w: 7px; --h: 6px;
}
.bird-wrapper.hop .tail { top: calc(var(--m) * 8px); }
.bird-wrapper.d-up .tail {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAECAYAAACtBE5DAAAAAXNSR0IArs4c6QAAACZJREFUGFdjjLfg+c8ABQtPfGGEsRmRJWCCIBqsApskXCuyApCRAD3YC0k2Q+wLAAAAAElFTkSuQmCC);
  --w: 6px; --h: 4px;
  left: calc(var(--m) * 17px); top: calc(var(--m) * 14px); z-index: 1;
}
.bird-wrapper.d-down .tail { left: calc(var(--m) * 17px); top: calc(var(--m) * 7px); }
/* Anchor */
.bird-wrapper .anchor {
  position: absolute;
  left: -6px; width: 0px; height: 0px;
  display: flex;
  justify-content: center;
  align-items: end;
}
.bird-wrapper.up .anchor,
.bird-wrapper.down .anchor {
  left: 50%; top: -12px;
  transform: translateX(-50%);
}
/* Speech bubble */
.bird-wrapper .speech-bubble {
  position: absolute;
  padding: 8px 12px;
  font-size: 0.75rem;
  color: #901F1A;
  --bg: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAADZJREFUKFNjZICCcA3+/zA2iF554yMjiAYTIMkV1z8gyzNEaAqAFTFik4SpBCmihwKCjiTkTQAtYSg9eIiJCAAAAABJRU5ErkJggg==);
  border-image: var(--bg) 3 fill / 6px / 0 stretch;
  image-rendering: pixelated;
  max-width: 180px;
  min-width: 60px;
  margin-bottom: 8px;
  white-space: nowrap;
}
.bird-wrapper .text-container { transform: var(--flip, scale(1)); }
.bird-wrapper .speech-bubble span {
  opacity: 0;
  animation: brd-fade-in forwards 0.2s;
}
.bird-wrapper .speech-bubble::after {
  content: '';
  position: absolute;
  bottom: -8px; left: 50%;
  transform: translateX(-50%);
  --w: 6px; --h: 6px; --m: 2;
  width: calc(var(--m) * var(--w));
  height: calc(var(--m) * var(--h));
  background-size: cover;
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAYAAADgzO9IAAAAAXNSR0IArs4c6QAAADdJREFUGFdjZGBgYPj///9/EI0MGPFKhGvw/19x/QNcQ4SmAANYBwggS6JIIEtiSMAkV974yAgAZ9UZpvr18B8AAAAASUVORK5CYII=);
  image-rendering: pixelated;
}
/* Keyframes */
@keyframes brd-fade-in { 0%, 99% { opacity: 0; } 100% { opacity: 1; } }
@keyframes brd-bop {
  0%   { transform: translateY(calc(var(--m) * var(--bop-start))) var(--flip); }
  50%  { transform: translateY(calc(var(--m) * var(--bop-middle))) var(--flip); }
  100% { transform: translateY(calc(var(--m) * var(--bop-end))) var(--flip); }
}
@keyframes brd-fly-arc {
  0%   { transform: translateY(calc(var(--m) * var(--bop-end))) var(--flip); }
  25%  { transform: translateY(calc(var(--m) * var(--bop-start))) var(--flip); }
  75%  { transform: translateY(calc(var(--m) * var(--bop-middle))) var(--flip); }
  100% { transform: translateY(calc(var(--m) * var(--bop-end))) var(--flip); }
}
@keyframes brd-wing-flap {
  0%, 100% { transform: var(--wing-start); }
  50%       { transform: var(--wing-end); }
}
@keyframes brd-wing-flap-side {
  0%, 100% {
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAALCAYAAACtWacbAAAAAXNSR0IArs4c6QAAADVJREFUKFNjZEAC8RY8/2HchSe+MMLYcAayAnSFYEXYFCArJE4RPlPgbhqMiogOAlwKYaEOAHB1IDa+c4RSAAAAAElFTkSuQmCC);
    --h: 11px; top: calc(var(--m) * -8px); z-index: 100;
  }
  25%, 75% {
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAECAYAAABcDxXOAAAAAXNSR0IArs4c6QAAACNJREFUGFdjZGBgYIi34PkPorGBhSe+MDLiUwDTRJwiYqwDAFHXC0mhFNqMAAAAAElFTkSuQmCC);
    --h: 4px; top: calc(var(--m) * 0px);
  }
  50% {
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAALCAYAAACtWacbAAAAAXNSR0IArs4c6QAAADVJREFUKFNjZEAC8RY8/2HchSe+MMLYcAayAnSFYEXYFCArJE4RPlPgbhqMiogOAlwKYaEOAHB1IDa+c4RSAAAAAElFTkSuQmCC);
    --h: 11px; top: calc(var(--m) * 0px); transform: scale(1, -1);
  }
}
`;

export default function Birds({ count = 4 }: { count?: number }) {
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'bird-css';
    styleEl.textContent = BIRD_CSS;
    document.head.appendChild(styleEl);

    const randomN = (max: number) => Math.ceil(Math.random() * max);
    const radToDeg = (rad: number) => Math.round(rad * (180 / Math.PI));
    const nearestN = (x: number, n: number) =>
      x === 0 ? 0 : x - 1 + Math.abs(((x - 1) % n) - n);
    const px = (n: number) => `${n}px`;

    const dirConfig: Record<number, string[]> = {
      0: ['up'],
      360: ['up'],
      45: ['d-up', 'right'],
      90: ['side', 'right'],
      135: ['d-down', 'right'],
      180: ['down'],
      225: ['d-down', 'left'],
      270: ['side', 'left'],
      315: ['d-up', 'left'],
    };

    const buildZones = () => {
      const viewW = window.innerWidth;
      const sections = [...document.querySelectorAll<HTMLElement>('.snap-section')];

      if (sections.length > 0) {
        return sections.map(section => {
          const rect = section.getBoundingClientRect();
          const pageTop = rect.top + window.scrollY;
          // Usa la altura real de la sección para no sobrepasar el contenido de la página
          const h = rect.height;
          return Array.from({ length: Math.max(count, 4) }, (_, p) => ({
            x: Math.max(100, Math.min(viewW - 100,
              100 + (p / (count - 1 || 1)) * (viewW - 200) + (Math.random() - 0.5) * 40,
            )),
            y: pageTop + 50 + Math.random() * Math.max(0, h - 100),
          }));
        });
      }

      const viewH = window.innerHeight;
      const pageH = document.body.scrollHeight;
      const numZones = Math.max(1, Math.ceil(pageH / viewH));
      return Array.from({ length: numZones }, (_, z) =>
        Array.from({ length: Math.max(count, 4) }, (_, p) => ({
          x: Math.max(100, Math.min(viewW - 100,
            100 + (p / (count - 1 || 1)) * (viewW - 200) + (Math.random() - 0.5) * 40,
          )),
          y: z * viewH + 50 + Math.random() * Math.max(0, viewH - 100),
        }))
      );
    };

    let zones = buildZones();

    const getCurrentZone = () => {
      const sections = [...document.querySelectorAll<HTMLElement>('.snap-section')];
      const mid = window.scrollY + window.innerHeight / 2;

      if (sections.length > 0) {
        let zone = 0;
        for (let i = 0; i < sections.length; i++) {
          const top = sections[i].getBoundingClientRect().top + window.scrollY;
          if (mid >= top) zone = i;
        }
        return zone;
      }

      return Math.floor(mid / window.innerHeight);
    };

    class SpeechBubble {
      el: HTMLElement;
      bird: Bird;

      constructor(bird: Bird, text: string) {
        this.bird = bird;
        this.el = document.createElement('div');
        this.el.className = 'speech-bubble';
        this.el.innerHTML = `<div class="text-container">${this.buildText(text)}</div>`;
        if (bird.bubble) bird.bubble.remove();
        bird.bubble = this;
        bird.anchor.appendChild(this.el);
        requestAnimationFrame(() => this.clamp());
      }

      buildText(text: string) {
        return [...text].reduce(
          (acc, l, i) =>
            (acc += `<span style="animation-delay:${(i * 0.04).toFixed(3)}s">${l}</span>`),
          '',
        );
      }

      clamp() {
        const rect = this.el.getBoundingClientRect();
        const vw = window.innerWidth;
        let offset = 0;
        if (rect.right > vw - 8) offset = -(rect.right - vw + 8);
        if (rect.left < 8) offset = 8 - rect.left;
        if (offset !== 0) this.el.style.transform = `translateX(${px(offset)})`;
      }

      remove() {
        this.el.remove();
        this.bird.bubble = null;
      }
    }

    class Bird {
      id: number;
      el: HTMLElement;
      anchor: HTMLElement;
      dirClasses: string[];
      pos: { x: number; y: number };
      isFlying: boolean;
      isHopping: boolean;
      hopCount: number;
      hopInterval: ReturnType<typeof setInterval> | null;
      twitchInterval: ReturnType<typeof setInterval> | null;
      animationTimer: ReturnType<typeof setTimeout> | null;
      bubble: SpeechBubble | null;
      currentZone: number;

      constructor(id: number, pos: { x: number; y: number }) {
        this.id = id;
        this.el = document.createElement('div');
        this.el.className = 'bird-wrapper';
        this.el.innerHTML = `
          <div class="bird">
            <div class="anchor"></div>
            <div class="head"></div>
            <div class="body"></div>
            <div class="wing left-wing"></div>
            <div class="wing right-wing"></div>
            <div class="legs">
              <div class="leg"></div>
              <div class="leg"></div>
            </div>
            <div class="tail"></div>
          </div>
        `;
        this.dirClasses = ['side', 'right'];
        this.pos = pos;
        this.hopCount = 0;
        this.hopInterval = null;
        this.twitchInterval = null;
        this.animationTimer = null;
        this.isFlying = false;
        this.isHopping = false;
        this.bubble = null;
        this.currentZone = -1;
        this.applyTransform(0);
        document.body.appendChild(this.el);
        this.anchor = this.el.querySelector('.anchor') as HTMLElement;
      }

      applyTransform(duration: number) {
        this.el.style.transition = `transform ${duration}s ease-in-out`;
        this.el.style.transform = `translate(${px(this.pos.x)}, ${px(this.pos.y)})`;
      }

      setClasses() {
        this.el.className = `bird-wrapper${this.isFlying ? ' fly' : ''} ${this.dirClasses.join(' ')}`;
      }

      elAngle(pos: { x: number; y: number }) {
        const angle = radToDeg(Math.atan2(this.pos.y - pos.y, this.pos.x - pos.x)) - 90;
        return Math.round(angle < 0 ? angle + 360 : angle);
      }

      faceDirection(pos: { x: number; y: number }) {
        this.dirClasses = dirConfig[nearestN(this.elAngle(pos), 45)];
        this.setClasses();
      }

      get isFacingRight() {
        return this.el.classList.contains('right');
      }

      hop() {
        clearInterval(this.hopInterval!);
        this.el.classList.add('hop');
        this.dirClasses = ['side', this.isFacingRight ? 'right' : 'left'];
        this.setClasses();
        this.hopCount = 0;
        this.hopInterval = setInterval(() => {
          if (this.hopCount % 2 === 0) {
            this.pos.x += this.isFacingRight ? 10 : -10;
            this.pos.x = Math.max(100, Math.min(window.innerWidth - 100, this.pos.x));
            this.applyTransform(0.2);
            this.el.classList.add('hop');
          } else {
            this.el.classList.remove('hop');
          }
          this.hopCount++;
          if (this.hopCount === 5) {
            clearInterval(this.hopInterval!);
            this.animationTimer = setTimeout(() => {
              this.el.classList.remove('hop');
              this.dirClasses = this.dirClasses.map(d =>
                d === 'side' ? ['d-up', 'd-down', 'side'][Math.floor(Math.random() * 3)] : d
              );
              this.setClasses();
            }, 200);
          }
        }, 100);
      }

      tweet() {
        const msg = TWEETS[Math.floor(Math.random() * TWEETS.length)];
        this.el.classList.add('tweet');
        new SpeechBubble(this, msg);
        setTimeout(() => {
          this.el.classList.remove('tweet');
          this.bubble?.remove();
        }, 2800);
      }

      twitch() {
        clearInterval(this.twitchInterval!);
        this.twitchInterval = setInterval(() => {
          this.el.className = `bird-wrapper pos-${randomN(3)} ${this.dirClasses.join(' ')}`;
        }, 800);
      }

      flyToZone(zoneIndex: number, alwaysFly = false) {
        if (this.isFlying || this.isHopping) return;
        const zone = zones[Math.min(zoneIndex, zones.length - 1)];
        if (!zone?.length) return;

        const perch = zone[this.id % zone.length];
        clearInterval(this.twitchInterval!);

        const newPos = { x: perch.x, y: perch.y };
        const alreadyThere =
          !alwaysFly &&
          zoneIndex === this.currentZone &&
          Math.abs(this.pos.y - newPos.y) < 30 &&
          Math.abs(this.pos.x - newPos.x) < 30;

        if (alreadyThere) {
          this.isHopping = true;
          this.animationTimer = setTimeout(() => {
            const r = Math.random();
            if (r < 0.55) this.twitch();
            else if (r < 0.88) this.hop();
            else this.tweet();
            this.animationTimer = setTimeout(() => {
              this.isHopping = false;
            }, 1200);
          }, 800 + this.id * 400 + Math.random() * 1200);
          return;
        }

        this.faceDirection(newPos);
        const dist = Math.hypot(newPos.x - this.pos.x, newPos.y - this.pos.y);
        const flyDuration = Math.max(0.8, Math.min(2.2, dist / 180));
        this.pos = newPos;
        this.applyTransform(flyDuration);
        this.isFlying = true;
        this.currentZone = zoneIndex;
        this.setClasses();

        clearTimeout(this.animationTimer!);
        this.animationTimer = setTimeout(() => {
          this.isFlying = false;
          this.dirClasses = dirConfig[[90, 135, 225, 270][Math.floor(Math.random() * 4)]];
          this.setClasses();
          this.twitch();
        }, flyDuration * 1000 + 300);
      }

      destroy() {
        clearInterval(this.twitchInterval!);
        clearInterval(this.hopInterval!);
        clearTimeout(this.animationTimer!);
        this.bubble?.remove();
        this.el.remove();
      }
    }

    const birds: Bird[] = Array.from(
      { length: count },
      (_, i) => new Bird(i, { x: -100, y: window.scrollY + window.innerHeight / 2 })
    );

    const initialZone = getCurrentZone();
    birds.forEach((bird, i) => {
      setTimeout(() => bird.flyToZone(initialZone, true), 400 + i * 180);
    });

    const settings = {
      isResizing: false,
      resizeTimer: null as ReturnType<typeof setTimeout> | null,
    };

    const scrollPoll = setInterval(() => {
      if (settings.isResizing) return;
      const zone = getCurrentZone();
      birds.forEach(bird => bird.flyToZone(zone));
    }, 900);

    const onResize = () => {
      settings.isResizing = true;
      clearTimeout(settings.resizeTimer!);
      zones = buildZones();
      const zone = getCurrentZone();
      birds.forEach(bird => {
        bird.isHopping = false;
        bird.isFlying = false;
        clearInterval(bird.hopInterval!);
        clearTimeout(bird.animationTimer!);
        bird.flyToZone(zone, true);
      });
      settings.resizeTimer = setTimeout(() => {
        settings.isResizing = false;
      }, 150);
    };

    window.addEventListener('resize', onResize);

    return () => {
      clearInterval(scrollPoll);
      window.removeEventListener('resize', onResize);
      birds.forEach(b => b.destroy());
      document.getElementById('bird-css')?.remove();
    };
  }, [count]);

  return null;
}
