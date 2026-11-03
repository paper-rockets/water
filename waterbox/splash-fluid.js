/* Local free-surface splash: interacting fluid parcels, reconstructed as a continuous
   density surface. No sprite droplets or prescribed crown animation. */
(() => {
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const tetra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
  const corners=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
  class SplashFluid {
    constructor(){this.groups=[];this.accumulator=0;this.maxGroups=4;this.returned=0;this.positions=new Float32Array(180000);this.normals=new Float32Array(180000);this.vertices=0;this.surfaceAge=0;}
    spawn(x,y,z,vx,vz,speed,heading,withdraw){
      if(this.groups.length>=this.maxGroups)this.retire(this.groups.shift());
      const group={particles:[],age:0,returnWater:withdraw};
      const c=Math.cos(heading),s=Math.sin(heading),launch=clamp(speed*.15,.9,1.8);
      // Finite water displaced around the hull: three close layers join into a sheet.
      for(let ring=0;ring<3;ring++)for(let i=0;i<24;i++)for(let layer=0;layer<2;layer++){
        const a=(i+Math.random()*.18)*Math.PI/12,ox=Math.cos(a)*(.074+ring*.013),oz=Math.sin(a)*(.055+ring*.013),r=Math.hypot(ox,oz),noise=.92+Math.random()*.16;
        const dx=(ox*c-oz*s)/r,dz=(ox*s+oz*c)/r;
        group.particles.push({x:x+ox*c-oz*s,y:y+.012+layer*.014,z:z+ox*s+oz*c,vx:dx*launch*.48+vx*.35,vy:launch*noise*(.82+.12*Math.sin(a*3)),vz:dz*launch*.48+vz*.35,density:0,ax:0,ay:0,az:0,volume:withdraw?.parcelVolume||0});
      }
      this.groups.push(group);
    }
    retire(group){if(group.returnWater){for(const p of group.particles)group.returnWater(p);group.returnWater=null;}group.particles.length=0;}
    step(dt,heightAt,onReturn){
      if(dt<=0)return;this.accumulator=Math.min(this.accumulator+dt,1/30);
      const h=.052,inv=1/h,key=(x,y,z)=>((x+512)<<20)^((y+512)<<10)^(z+512);
      while(this.accumulator>=1/90){this.accumulator-=1/90;const step=1/90;
        for(let g=this.groups.length-1;g>=0;g--){const group=this.groups[g],ps=group.particles;group.age+=step;
          const hash=new Map();for(let i=0;i<ps.length;i++){const p=ps[i],k=key(Math.floor(p.x*inv),Math.floor(p.y*inv),Math.floor(p.z*inv));if(!hash.has(k))hash.set(k,[]);hash.get(k).push(i);p.density=0;}
          const neighbors=[];
          for(let i=0;i<ps.length;i++){const p=ps[i],cx=Math.floor(p.x*inv),cy=Math.floor(p.y*inv),cz=Math.floor(p.z*inv),list=[];
            for(let z=-1;z<=1;z++)for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++)for(const j of hash.get(key(cx+x,cy+y,cz+z))||[]){const q=ps[j],dx=p.x-q.x,dy=p.y-q.y,dz=p.z-q.z,r=Math.hypot(dx,dy,dz);if(r<h){const w=1-r/h;p.density+=w*w;list.push(j,dx,dy,dz,r,w);}}
            neighbors.push(list);
          }
          // Symmetric pressure, viscosity and a weak cohesive surface force.
          for(let i=0;i<ps.length;i++){const p=ps[i];p.ax=0;p.ay=-9.81;p.az=0;
            for(let k=0;k<neighbors[i].length;k+=6){const list=neighbors[i],j=list[k],dx=list[k+1],dy=list[k+2],dz=list[k+3],r=list[k+4],w=list[k+5];if(i===j||r<.0001)continue;const q=ps[j],pressure=clamp((p.density+q.density-6)*.45,-.12,3)*w/r,viscosity=w*.22;
              p.ax+=dx*pressure+(q.vx-p.vx)*viscosity;p.ay+=dy*pressure+(q.vy-p.vy)*viscosity;p.az+=dz*pressure+(q.vz-p.vz)*viscosity;
            }
          }
          for(let i=ps.length-1;i>=0;i--){const p=ps[i];p.vx+=clamp(p.ax,-35,35)*step;p.vy+=clamp(p.ay,-40,30)*step;p.vz+=clamp(p.az,-35,35)*step;p.x+=p.vx*step;p.y+=p.vy*step;p.z+=p.vz*step;
            if(group.age>2||(group.age>.08&&p.y<heightAt(p.x,p.z))){group.returnWater?.(p);if(p.vy<-.3)onReturn(p);ps.splice(i,1);this.returned++;}
          }
          if(!ps.length)this.groups.splice(g,1);
        }
      }
      this.surfaceAge+=dt;
    }
    mesh(force=false){
      if(!force&&this.surfaceAge<1/30)return false;this.surfaceAge=0;this.vertices=0;
      const N=23,iso=.6,field=new Float32Array(N*N*N);
      for(const group of this.groups){const ps=group.particles;if(!ps.length)continue;
        let lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(const p of ps){lo[0]=Math.min(lo[0],p.x);lo[1]=Math.min(lo[1],p.y);lo[2]=Math.min(lo[2],p.z);hi[0]=Math.max(hi[0],p.x);hi[1]=Math.max(hi[1],p.y);hi[2]=Math.max(hi[2],p.z);}
        const cell=Math.max(.013,...hi.map((v,i)=>(v-lo[i]+.10)/(N-1)));lo=lo.map((v,i)=>(v+hi[i]-cell*(N-1))/2);field.fill(0);
        const radius=.042,reach=Math.ceil(radius/cell),index=(x,y,z)=>(z*N+y)*N+x;
        for(const p of ps){const cx=(p.x-lo[0])/cell,cy=(p.y-lo[1])/cell,cz=(p.z-lo[2])/cell;
          for(let z=Math.max(0,Math.floor(cz)-reach);z<=Math.min(N-1,Math.ceil(cz)+reach);z++)for(let y=Math.max(0,Math.floor(cy)-reach);y<=Math.min(N-1,Math.ceil(cy)+reach);y++)for(let x=Math.max(0,Math.floor(cx)-reach);x<=Math.min(N-1,Math.ceil(cx)+reach);x++){const r2=((x-cx)**2+(y-cy)**2+(z-cz)**2)*cell*cell/(radius*radius);if(r2<1)field[index(x,y,z)]+=(1-r2)**3;}
        }
        const gradient=(x,y,z)=>[field[index(clamp(x+1,0,N-1),y,z)]-field[index(clamp(x-1,0,N-1),y,z)],field[index(x,clamp(y+1,0,N-1),z)]-field[index(x,clamp(y-1,0,N-1),z)],field[index(x,y,clamp(z+1,0,N-1))]-field[index(x,y,clamp(z-1,0,N-1))]];
        const emit=(a,b,c)=>{if((this.vertices+3)*3>this.positions.length)return;const ab=b.p.map((v,i)=>v-a.p[i]),ac=c.p.map((v,i)=>v-a.p[i]),cross=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]],normal=a.n.map((v,i)=>v+b.n[i]+c.n[i]);if(cross.reduce((sum,v,i)=>sum+v*normal[i],0)<0)[b,c]=[c,b];for(const v of [a,b,c]){this.positions.set(v.p,this.vertices*3);this.normals.set(v.n,this.vertices*3);this.vertices++;}};
        for(let z=0;z<N-1;z++)for(let y=0;y<N-1;y++)for(let x=0;x<N-1;x++){
          const values=corners.map(c=>field[index(x+c[0],y+c[1],z+c[2])]);if(values.every(v=>v<iso)||values.every(v=>v>=iso))continue;
          const verts=corners.map((c,i)=>({p:[lo[0]+(x+c[0])*cell,lo[1]+(y+c[1])*cell,lo[2]+(z+c[2])*cell],n:gradient(x+c[0],y+c[1],z+c[2]).map(v=>-v),v:values[i]}));
          const edge=(a,b)=>{const t=(iso-a.v)/(b.v-a.v),n=a.n.map((v,i)=>v+(b.n[i]-v)*t),len=Math.hypot(...n)||1;return {p:a.p.map((v,i)=>v+(b.p[i]-v)*t),n:n.map(v=>v/len)};};
          for(const t of tetra){const inside=t.filter(i=>values[i]>=iso),outside=t.filter(i=>values[i]<iso);if(!inside.length||!outside.length)continue;
            if(inside.length===1){const a=verts[inside[0]],p=outside.map(i=>edge(a,verts[i]));emit(...p);}
            else if(inside.length===3){const a=verts[outside[0]],p=inside.map(i=>edge(a,verts[i]));emit(...p);}
            else{const a=edge(verts[inside[0]],verts[outside[0]]),b=edge(verts[inside[0]],verts[outside[1]]),c=edge(verts[inside[1]],verts[outside[0]]),d=edge(verts[inside[1]],verts[outside[1]]);emit(a,b,c);emit(b,d,c);}
          }
        }
      }
      return true;
    }
    clear(){for(const group of this.groups)this.retire(group);this.groups=[];this.vertices=0;this.surfaceAge=1;}
  }
  globalThis.SplashFluid=SplashFluid;
})();
