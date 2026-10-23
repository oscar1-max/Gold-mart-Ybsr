"use client";
import Link from "next/link";
import { useEffect,useRef,useState } from "react";

type Product={id:number;name:string;image_url?:string|null;price:string|number;currency?:string;category_name?:string};
type Match={product:Product;difference:number};
const API="https://goldmart-backend-yoxc.onrender.com/api";
async function fingerprint(src:string):Promise<number[]> {
  const image=new Image();
  image.crossOrigin="anonymous";
  image.referrerPolicy="no-referrer";
  await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error("Cannot analyze this product image."));image.src=src;});
  const canvas=document.createElement("canvas");canvas.width=8;canvas.height=8;
  const ctx=canvas.getContext("2d",{willReadFrequently:true});if(!ctx)throw new Error("Image analysis unavailable.");
  ctx.drawImage(image,0,0,8,8);
  const data=ctx.getImageData(0,0,8,8).data;
  const values:number[]=[];for(let i=0;i<data.length;i+=4){values.push(data[i],data[i+1],data[i+2]);}
  return values;
}
function distance(a:number[],b:number[]){return a.reduce((sum,v,i)=>sum+Math.abs(v-b[i]),0)/a.length;}
export default function VisualSearchPage(){
  const video=useRef<HTMLVideoElement>(null);const stream=useRef<MediaStream|null>(null);
  const gallery=useRef<HTMLInputElement>(null);
  const [camera,setCamera]=useState(false);const [image,setImage]=useState("");const [matches,setMatches]=useState<Match[]>([]);
  const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [searched,setSearched]=useState(false);
  function stop(){stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;setCamera(false);}
  useEffect(()=>()=>{stream.current?.getTracks().forEach(t=>t.stop());},[]);
  async function openCamera(){
    stop();setError("");
    if(!navigator.mediaDevices?.getUserMedia){setError("Your browser cannot open the live camera. Try Take Photo / Gallery below.");return;}
    try{const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});stream.current=media;setCamera(true);}
    catch{setError("Camera access was denied or unavailable. Use Take Photo / Gallery instead.");}
  }
  useEffect(()=>{if(camera&&video.current&&stream.current){video.current.srcObject=stream.current;void video.current.play().catch(()=>{});}},[camera]);
  function capture(){if(!video.current?.videoWidth){setError("Camera is not ready. Try again.");return;}
    const c=document.createElement("canvas");c.width=video.current.videoWidth;c.height=video.current.videoHeight;
    c.getContext("2d")?.drawImage(video.current,0,0);setImage(c.toDataURL("image/jpeg",0.85));setMatches([]);setSearched(false);stop();
  }
  function choose(e:React.ChangeEvent<HTMLInputElement>){const f=e.target.files?.[0];if(!f)return;if(!f.type.startsWith("image/")){setError("Please choose an image.");return;}if(f.size>10*1024*1024){setError("Image must be under 10MB.");return;}
    const reader=new FileReader();reader.onload=()=>{setImage(String(reader.result||""));setMatches([]);setSearched(false);setError("");stop();};reader.readAsDataURL(f);e.target.value="";
  }
  async function search(){if(!image||busy)return;setBusy(true);setError("");setSearched(false);setMatches([]);
    try{const resp=await fetch(`${API}/products`,{cache:"no-store"});const data=await resp.json();if(!resp.ok||!data.success)throw new Error(data.message||"Could not load products.");
      const products:Product[]=Array.isArray(data.products)?data.products.filter((p:Product)=>p.image_url):[];
      if(!products.length){setSearched(true);return;}
      const target=await fingerprint(image);
      // Many Cloudinary images allow cross-origin canvas use; inaccessible images are skipped.
      const results=await Promise.all(products.slice(0,80).map(async product=>{try{return {product,difference:distance(target,await fingerprint(product.image_url!))};}catch{return null;}}));
      const scored=results.filter((value):value is Match=>value!==null).sort((a,b)=>a.difference-b.difference).slice(0,12);
      if(!scored.length)throw new Error("Product images blocked browser comparison. Try another picture or browse the shop.");
      setMatches(scored);setSearched(true);
    }catch(err){setError(err instanceof Error?err.message:"Image matching failed.");}finally{setBusy(false);}
  }
  return <main className="min-h-screen bg-[#FFFFFF] pb-32 text-[#1A3C32]">
    <header className="border-b border-[#F7F7F5] bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5"><Link href="/" className="text-2xl font-black">Gold<span className="text-[#D4AF37]">Mart</span></Link><Link href="/shop" className="rounded-full border px-4 py-2 text-sm font-bold">Shop All</Link></div></header>
    <section className="mx-auto max-w-6xl px-4 pt-8"><div className="rounded-[30px] bg-[linear-gradient(135deg,#0A1F1A_0%,#1A3C32_50%,#D4AF37_100%)] p-7 text-white sm:p-10"><p className="text-xs font-black uppercase tracking-[0.22em] text-[#F5E6A3]">GoldMart · Photo discovery</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">Find it with a photo.</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">Take a picture or upload one. GoldMart compares its colors and appearance with available product photos to show approximate visual matches.</p></div>
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><div className="rounded-[26px] border border-[#F7F7F5] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Your image</h2>
      <input type="file" ref={gallery} accept="image/*" onChange={choose} className="hidden" aria-label="Select a photo"/>
      {camera?<div><video ref={video} playsInline muted autoPlay className="mt-4 aspect-[4/3] w-full rounded-2xl bg-black object-cover"/><div className="mt-4 flex gap-2"><button type="button" onClick={capture} className="flex-1 rounded-xl bg-[#1A3C32] px-4 py-3 font-bold text-white">📸 Take Photo</button><button type="button" onClick={stop} className="rounded-xl border px-4 py-3 font-bold">Cancel</button></div></div>:<div className="mt-4 flex min-h-64 items-center justify-center overflow-hidden rounded-2xl bg-[#F7F7F5]">{image?<img src={image} alt="Your chosen image" className="max-h-[360px] w-full object-contain"/>:<span className="text-center text-6xl">📷</span>}</div>}
      {!camera&&<div className="mt-4 grid gap-2 sm:grid-cols-2"><button type="button" onClick={()=>void openCamera()} className="rounded-xl bg-[#1A3C32] px-4 py-3 font-bold text-white">📷 Open Camera</button><button type="button" onClick={()=>gallery.current?.click()} className="rounded-xl border border-[#F5E6A3] bg-white px-4 py-3 font-bold">Take Photo / Gallery</button></div>}
      {image&&!camera&&<button type="button" disabled={busy} onClick={()=>void search()} className="mt-3 w-full rounded-xl bg-[#1A3C32] px-5 py-4 font-black text-white disabled:opacity-50">{busy?"Comparing images...":"🔍 Search Similar Products"}</button>}
      {error&&<p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <p className="mt-4 text-xs leading-5 text-[#D4AF37]">Camera permission and HTTPS are required for live capture. Image comparison happens in your browser; photos are not uploaded to GoldMart by this tool.</p>
      </div><div className="rounded-[26px] border border-[#F7F7F5] bg-white p-5 shadow-sm"><h2 className="text-lg font-black">Similar looking products</h2><p className="mt-2 text-xs text-[#D4AF37]">First version: approximate image/color matching, not AI object identification. Results depend on product image access.</p>
      {busy&&<p className="mt-6 text-sm">Comparing catalog photos…</p>}
      {searched&&matches.length===0&&<p className="mt-6 text-sm">No matching product photos are available.</p>}
      {!searched&&!busy&&<p className="mt-6 text-sm text-[#D4AF37]">Take a photo, then tap Search Similar Products.</p>}
      <div className="mt-4 grid grid-cols-2 gap-3">{matches.map(({product})=><Link key={product.id} href={`/product/${product.id}`} className="overflow-hidden rounded-xl border border-[#F7F7F5] transition hover:border-[#D4AF37]"><img src={product.image_url||""} alt={product.name} loading="lazy" className="aspect-square w-full object-cover"/><div className="p-3"><p className="line-clamp-2 text-xs font-black">{product.name}</p><p className="mt-1 text-xs font-bold text-[#1A3C32]">{product.currency||"USD"} {product.price}</p></div></Link>)}</div></div></div></section></main>;
}
