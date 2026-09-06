import React from 'react'
export function useRouter() { return {back:()=>history.back(),push:(url:string)=>location.assign(url)} }
export default function Link({href,children,...props}:React.ComponentProps<'a'>) { return <a href={href} {...props}>{children}</a> }
