import Clutter from "gi://Clutter";
import GLib from "gi://GLib";
import { WindowManager } from "./window.js";

/**
 * @typedef {{
 *  height: number,
 *  width: number,
 *  x: number,
 *  y: number
 * }} Rect
 */

/**
 *  @typedef {Object} MetaWindow;
 *
 */

class Animator {
  constructor() {
    /** @type {Map<MetaWindow, {fromRect: Rect, toRect: Rect}} */
    this.animationMetaData = new Map();
    this.durationMS = 500;
    this.inProgress = false;
    this.clutterTimeline = null;
    /** @type {WindowManager} */
    this.wm = null;
    /** @type {WeakMap<MetaWindow, Rect>} */
    this.inProgressMetaData = new WeakMap();
    this.queuedMetaData = new WeakMap();
  }

  setWindowManager(wm) {
    this.wm = wm;
  }

  /**
   *
   * @param {Rect} fromRect
   * @param {Rect} toRect
   */
  add(metaWin, fromRect, toRect) {
    if (!metaWin) return;

    // console.log(
    //   "Adding animation",
    //   fromRect.width,
    //   toRect.width,
    //   fromRect.height,
    //   toRect.height,
    //   fromRect.x,
    //   toRect.x,
    //   fromRect.y,
    //   toRect.y
    // );
    this.animationMetaData.set(metaWin, {
      fromRect,
      toRect,
    });
  }

  filterSameRects() {
    for (const [metaWin, value] of this.animationMetaData) {
      const { fromRect, toRect } = value;

      if (
        fromRect.x === toRect.x &&
        fromRect.y === toRect.y &&
        fromRect.width === toRect.width &&
        fromRect.height === toRect.height
      ) {
        delete this.animationMetaData[metaWin];
      }
    }
  }

  /**
   * Check if two rects are the same
   *
   * @param {Rect} rect1
   * @param {Rect} rect2
   */
  isSameRect(rect1, rect2) {
    return (
      rect1.x === rect2.x &&
      rect1.y === rect2.y &&
      rect1.width === rect2.width &&
      rect1.height === rect2.height
    );
  }

  cubicBezier(from, to, p1, p2, t) {
    return from + (to - from) * t;
    // return (
    //   from * (1 - t) ** 3 +
    //   3 * p1 * (1 - t) ** 2 * t +
    //   3 * p2 * (1 - t) * t ** 2 +
    //   to * t ** 3
    // );
  }

  /**
   *
   * @param {Rect} fromRect
   * @param {Rect} toRect
   */
  animate(metaWin, fromRect, toRect) {
    // if (this.isSameRect(toRect, fromRect)) {
    //   return;
    // }

    const windowActor = metaWin.get_compositor_private();
    // if (!windowActor) {
    //   return;
    // }

    // if (
    //   this.inProgressMetaData.has(metaWin)
    // ) {
    //   this.queuedMetaData.set(metaWin, { ...toRect });
    //   console.log("Already animating :)", this.inProgressMetaData.get(metaWin), toRect);
    //   return;
    // }

    // this.inProgressMetaData.set(metaWin, { ...toRect });
    const needToResize = fromRect.width !== toRect.width || fromRect.height !== toRect.height;

    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
      if (needToResize) {
        metaWin.move_resize_frame(true, toRect.x, toRect.y, toRect.width, toRect.height);
        metaWin.move_frame(true, toRect.x, toRect.y);

        // const actorStage = windowActor.get_stage();

        // let count = 0;
        // const stageSignal = actorStage.connect("after-paint", () => {
        //   console.log("scaleX: COUNT: " + count);
        //   count++;

        //   if(count <= 1) return;

        //   const frameRect = metaWin.get_frame_rect();
        //   let scaleX = 1,
        //     scaleY = 1;

        //   if (frameRect.width !== toRect.width) {
        //     scaleX = toRect.width / frameRect.width;
        //   }

        //   if (frameRect.height !== toRect.height) {
        //     scaleY = toRect.height / frameRect.height;
        //   }

        //   windowActor.set_scale(scaleX, scaleY);
        //   this.inProgressMetaData.delete(metaWin);
        //   metaWin.move_frame(true, toRect.x, toRect.y);

        //   actorStage.disconnect(stageSignal);

        //   if (this.queuedMetaData.has(metaWin)) {
        //     const frameRect = metaWin.get_frame_rect();

        //     const toRect = this.queuedMetaData.get(metaWin);
        //     const fromRect = {
        //       x: frameRect.x,
        //       y: frameRect.y,
        //       width: frameRect.width,
        //       height: frameRect.height,
        //     };

        //     this.queuedMetaData.delete(metaWin);
        //     this.animate(metaWin, fromRect , toRect);

        //     console.log("Animating queued");
        //   }
        // });
      } else {
        // windowActor.set_scale(1, 1);
        // this.inProgressMetaData.delete(metaWin);
        // windowActor.ease({
        //   x: toRect.x,
        //   y: toRect.y,
        //   duration: 500,
        //   mode: Clutter.AnimationMode.EASE_IN_OUT_QUAD,
        // })
        metaWin.move_frame(true, toRect.x, toRect.y);
      }

      return GLib.SOURCE_REMOVE;
    });
  }
}

const AnimationHandler = new Animator();

export default AnimationHandler;
