import AppKit

let width = 1200, height = 630
let image = NSImage(size: NSSize(width: width, height: height))
image.lockFocusFlipped(true)
func color(_ hex: UInt32, _ alpha: CGFloat = 1) -> NSColor {
 NSColor(srgbRed: CGFloat((hex >> 16) & 255)/255, green: CGFloat((hex >> 8) & 255)/255, blue: CGFloat(hex & 255)/255, alpha: alpha)
}
let red=color(0xbf2730), ink=color(0x302e2b), muted=color(0x817b74), line=color(0xe4e0d8), green=color(0x6e8572)
func rect(_ x:CGFloat,_ y:CGFloat,_ w:CGFloat,_ h:CGFloat,_ fill:NSColor,_ radius:CGFloat=0){fill.setFill();NSBezierPath(roundedRect:NSRect(x:x,y:y,width:w,height:h),xRadius:radius,yRadius:radius).fill()}
func text(_ value:String,_ x:CGFloat,_ y:CGFloat,_ size:CGFloat,_ fill:NSColor,_ weight:NSFont.Weight = .regular){
 (value as NSString).draw(at:NSPoint(x:x,y:y),withAttributes:[.font:NSFont.systemFont(ofSize:size,weight:weight),.foregroundColor:fill])
}
func path(_ points:[NSPoint],_ stroke:NSColor,_ thickness:CGFloat=1){let p=NSBezierPath();p.move(to:points[0]);for v in points.dropFirst(){p.line(to:v)};p.lineWidth=thickness;p.lineCapStyle = .round;stroke.setStroke();p.stroke()}
func circle(_ x:CGFloat,_ y:CGFloat,_ radius:CGFloat,_ stroke:NSColor,_ thickness:CGFloat=1){let p=NSBezierPath(ovalIn:NSRect(x:x-radius,y:y-radius,width:radius*2,height:radius*2));p.lineWidth=thickness;stroke.setStroke();p.stroke()}
rect(0,0,1200,630,color(0xfaf8f3));rect(0,0,1200,10,red)
rect(64,52,46,48,red,5);text("巨",70,54,34,.white,.bold)
text("去巨城",126,51,25,ink,.bold);text("BIG CITY, HERE I COME.",127,85,10,muted,.medium)
text("HSINCHU, TW",984,68,13,muted,.medium)
path([NSPoint(x:64,y:125),NSPoint(x:1136,y:125)],line)
text("新竹人的宇宙中心",66,161,16,red,.semibold)
text("去巨城",60,195,94,red,.heavy)
text("不是在巨城，",66,325,34,ink,.bold)
text("就是在去巨城的路上。",66,376,34,ink,.bold)
path([NSPoint(x:67,y:429),NSPoint(x:394,y:426),NSPoint(x:442,y:431)],red,3)
text("距離・方向・風向・貢丸之旅",66,468,19,muted,.medium)
let cx:CGFloat=924, cy:CGFloat=316
for r:CGFloat in [66,110,154]{circle(cx,cy,r,line)}
for degree in stride(from:0,to:360,by:10){let a=CGFloat(degree)*CGFloat.pi/180;path([NSPoint(x:cx+154*sin(a),y:cy-154*cos(a)),NSPoint(x:cx+160*sin(a),y:cy-160*cos(a))],color(0xc9c0b5))}
path([NSPoint(x:cx-135,y:cy),NSPoint(x:cx+135,y:cy)],color(0xe4e0d8,0.5))
path([NSPoint(x:cx,y:cy-135),NSPoint(x:cx,y:cy+135)],color(0xe4e0d8,0.5))
let fan=NSBezierPath();fan.move(to:NSPoint(x:cx,y:cy))
for deg in stride(from:35,through:85,by:1){let a=CGFloat(deg)*CGFloat.pi/180;fan.line(to:NSPoint(x:cx+130*sin(a),y:cy-130*cos(a)))}
fan.close();color(0x6e8572,0.22).setFill();fan.fill()
text("N",cx-6,cy-188,14,red,.bold);text("S",cx-5,cy+168,13,muted);text("W",cx-188,cy-10,13,muted);text("E",cx+172,cy-10,13,muted)
let mx=cx+49,my=cy-110
path([NSPoint(x:cx,y:cy),NSPoint(x:mx,y:my)],color(0xbf2730,0.5),1.5)
rect(mx-25,my-25,50,52,red,7);text("巨",mx-17,my-22,36,.white,.bold)
text("BIG CITY",mx-29,my+35,10,red,.bold)
color(0xbf2730,0.12).setFill();NSBezierPath(ovalIn:NSRect(x:cx-15,y:cy-15,width:30,height:30)).fill()
red.setFill();NSBezierPath(ovalIn:NSRect(x:cx-5,y:cy-5,width:10,height:10)).fill()
text("你在這裡",cx-30,cy+25,12,muted)
text("所有方向，終將通往巨城",789,508,16,muted,.medium)
path([NSPoint(x:64,y:560),NSPoint(x:1136,y:560)],line)
text("地球繞著太陽轉，新竹人繞著巨城轉。",66,581,14,muted)
text("非官方趣味專案",1035,583,11,muted)
image.unlockFocus()
guard let cg=image.cgImage(forProposedRect:nil,context:nil,hints:nil) else { fatalError("Cannot render social image") }
let outputContext=CGContext(data:nil,width:width,height:height,bitsPerComponent:8,bytesPerRow:width*4,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!
outputContext.interpolationQuality = .high
outputContext.draw(cg,in:CGRect(x:0,y:0,width:width,height:height))
let representation=NSBitmapImageRep(cgImage:outputContext.makeImage()!)
guard let data=representation.representation(using:.png,properties:[:]) else {fatalError("Cannot encode PNG")}
let output=CommandLine.arguments.count>1 ? CommandLine.arguments[1] : "social-preview.png"
try data.write(to:URL(fileURLWithPath:output))
print("Saved \(output): \(representation.pixelsWide) × \(representation.pixelsHigh)")
