import React, { useEffect, useMemo } from 'react';
import { useBlurhash } from '../utils/blurhash/useBlurhash';
import { isBlurhashString, isThumbhashString } from '../utils/resolveSources';
import { thumbHashStringToDataURL } from '../utils/thumbhash/thumbhash';
function ensureUnit(value) {
    const trimmedValue = String(value).trim();
    if (trimmedValue.endsWith('%')) {
        return trimmedValue;
    }
    return `${trimmedValue}px`;
}
function getObjectPositionFromContentPositionObject(contentPosition) {
    const resolvedPosition = { ...contentPosition };
    if (!resolvedPosition) {
        return '50% 50%';
    }
    if (resolvedPosition.top == null && resolvedPosition.bottom == null) {
        resolvedPosition.top = '50%';
    }
    if (resolvedPosition.left == null && resolvedPosition.right == null) {
        resolvedPosition.left = '50%';
    }
    return (['top', 'bottom', 'left', 'right']
        .map((key) => {
        if (key in resolvedPosition) {
            return `${key} ${ensureUnit(resolvedPosition[key])}`;
        }
        return '';
    })
        .join(' ') || '50% 50%');
}
function getFetchPriorityFromImagePriority(priority = 'normal') {
    return priority && ['low', 'high'].includes(priority) ? priority : 'auto';
}
function getImgPropsFromSource(source) {
    if (source && 'srcset' in source) {
        return {
            srcSet: source.srcset,
            sizes: source.sizes,
        };
    }
    return {};
}
const ImageWrapper = React.forwardRef(({ source, events, contentPosition, hashPlaceholderContentPosition, priority, style, hashPlaceholderStyle, tintColor, className, accessibilityLabel, ...props }, ref) => {
    useEffect(() => {
        events?.onMount?.forEach((e) => e?.());
    }, []);
    const isBlurhash = isBlurhashString(source?.uri || '');
    const isThumbhash = isThumbhashString(source?.uri || '');
    const isHash = isBlurhash || isThumbhash;
    // Thumbhash uri always has to start with 'thumbhash:/'
    const thumbhash = source?.uri?.replace(/thumbhash:\//, '');
    const thumbhashUri = useMemo(() => (isThumbhash ? thumbHashStringToDataURL(thumbhash ?? '') : null), [thumbhash]);
    const blurhashUri = useBlurhash(isBlurhash ? source?.uri : null, source?.width, source?.height);
    if (!source) {
        return null;
    }
    const objectPosition = getObjectPositionFromContentPositionObject(isHash ? hashPlaceholderContentPosition : contentPosition);
    const uri = isHash ? blurhashUri ?? thumbhashUri : source?.uri;
    return (React.createElement(React.Fragment, null,
        tintColor && (React.createElement("svg", null,
            React.createElement("defs", null,
                React.createElement("filter", { id: `tint-${tintColor}`, x: "0", y: "0", width: "0", height: "0" },
                    React.createElement("feFlood", { floodColor: tintColor, floodOpacity: "1", result: "flood" }),
                    React.createElement("feComposite", { in: "flood", in2: "SourceAlpha", operator: "in" }))))),
        React.createElement("img", { ref: ref, alt: accessibilityLabel, className: className, src: uri || undefined, ...getImgPropsFromSource(source), key: source?.uri, ...props, style: {
                width: '100%',
                height: '100%',
                position: 'absolute',
                left: 0,
                right: 0,
                objectPosition,
                filter: tintColor ? `url(#tint-${tintColor})` : '',
                ...style,
                ...(isHash ? hashPlaceholderStyle : {}),
            }, 
            // @ts-ignore
            // eslint-disable-next-line react/no-unknown-property
            fetchpriority: getFetchPriorityFromImagePriority(priority || 'normal'), onLoad: (event) => {
                if (typeof window !== 'undefined') {
                    // this ensures the animation will run, since the starting class is applied at least 1 frame before the target class set in the onLoad event callback
                    window.requestAnimationFrame(() => {
                        events?.onLoad?.forEach((e) => e?.(event));
                    });
                }
                else {
                    events?.onLoad?.forEach((e) => e?.(event));
                }
            }, onTransitionEnd: () => events?.onTransitionEnd?.forEach((e) => e?.()), onError: () => events?.onError?.forEach((e) => e?.({ source: source || null })) })));
});
export default ImageWrapper;
//# sourceMappingURL=ImageWrapper.js.map