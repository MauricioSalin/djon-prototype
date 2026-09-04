"use client";

import { useEffect } from "react";

let activeLocks = 0;
let previousOverflow = "";
let previousPaddingRight = "";
let previousPosition = "";
let previousTop = "";
let previousLeft = "";
let previousRight = "";
let previousWidth = "";
let lockedScrollX = 0;
let lockedScrollY = 0;

function lockBodyScroll() {
  if (activeLocks === 0) {
    const body = document.body;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    lockedScrollX = window.scrollX;
    lockedScrollY = window.scrollY;
    previousOverflow = body.style.overflow;
    previousPaddingRight = body.style.paddingRight;
    previousPosition = body.style.position;
    previousTop = body.style.top;
    previousLeft = body.style.left;
    previousRight = body.style.right;
    previousWidth = body.style.width;

    if (scrollbarWidth > 0) {
      const currentPadding = Number.parseFloat(getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
    }
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `${-lockedScrollY}px`;
    body.style.left = `${-lockedScrollX}px`;
    body.style.right = "0";
    body.style.width = "100%";
  }
  activeLocks += 1;
}

function unlockBodyScroll() {
  activeLocks = Math.max(0, activeLocks - 1);
  if (activeLocks !== 0) return;

  document.body.style.overflow = previousOverflow;
  document.body.style.paddingRight = previousPaddingRight;
  document.body.style.position = previousPosition;
  document.body.style.top = previousTop;
  document.body.style.left = previousLeft;
  document.body.style.right = previousRight;
  document.body.style.width = previousWidth;
  window.scrollTo(lockedScrollX, lockedScrollY);
}

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    lockBodyScroll();
    return unlockBodyScroll;
  }, [locked]);
}
