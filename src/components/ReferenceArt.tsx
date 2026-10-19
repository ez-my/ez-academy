import React from 'react';
const source='/images/home/exact-reference-v2.webp';
/** Reuse the supplied illustration pixels, without regenerating or distorting the artwork. */
export function ReferenceArt({box,label='',className=''}:{box:[number,number,number,number];label?:string;className?:string}){const[x,y,w,h]=box;return <div className={`ref-art ${className}`} style={{aspectRatio:`${w}/${h}`}} role={label?'img':undefined} aria-label={label||undefined} aria-hidden={label?undefined:true}><img src={source} alt="" draggable={false} style={{width:`${836/w*100}%`,maxWidth:'none',left:`${-x/w*100}%`,top:0,transform:`translateY(${-y/1881*100}%)`}}/></div>}
