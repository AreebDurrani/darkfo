/*
Copyright 2014 darkf, Stratege

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// Geometry-related functions, for the hex and isometric grids

// geometry constants
const TILE_WIDTH = 80
const TILE_HEIGHT = 36
const HEX_GRID_SIZE = 200 // hex grid is 200x200

interface Point {
    x: number;
    y: number;
}

interface Point3 {
    x: number;
    y: number;
    z: number;
}

interface BoundingBox {
    x: number;
    y: number;
    w: number;
    h: number;
}

function toTileNum(position: Point): number {
    return position.y * 200 + position.x
}

function fromTileNum(tile: number): Point {
    return {x: tile % 200, y: Math.floor(tile / 200)} // TODO: use x|0 instead of floor for some of these
}

function tileToScreen(x: number, y: number): Point {
    x = 99 - x // this algorithm expects x to be reversed
    var sx = 4752 + (32 * y) - (48 * x)
    var sy = (24 * y) + (12 * x)

   return {x: sx, y: sy}
}

function tileFromScreen(x: number, y: number): Point {
    var off_x = -4800 + x
    var off_y = y
    var xx = off_x - off_y * 4 / 3
    var tx = xx / 64

    if (xx >= 0) tx++
    tx = -tx
    var yy = off_y + off_x / 4
    var ty = yy / 32
    if (yy < 0) ty--

    return {x: 99 - Math.round(tx), y: Math.round(ty)}
}

function hexToTile(pos: Point): Point {
    // Calculate screen position of `pos`, then look up which roof tile that belongs to,
    // and then calculate the square tile position from the screen position.
    const scrPos = hexToScreen(pos.x, pos.y);
    return tileFromScreen(scrPos.x, scrPos.y);
}

function centerTile(): Point {
    return hexFromScreen(cameraX + ((SCREEN_WIDTH / 2)|0) - 32,
                         cameraY + ((SCREEN_HEIGHT / 2)|0) - 16)
    /*return hexFromScreen(cameraX + Math.floor((SCREEN_WIDTH - 32) / 2),
                         cameraY + Math.floor((SCREEN_HEIGHT - 16) / 2))*/
}

var tile_center = {x: 0, y: 0}

function setCenterTile() {
    tile_center = centerTile()
}

// tile_coord(0x319E) == {x: -336, y: -250}
// tile_coord(0x319F) should be the same
// tile_coord(0x5018) should be (230, 304)

function tile_coord(tileNum: number): Point|null {
    if(tileNum < 0 || tileNum >= 200*200)
        return null

    //var tile_x = 0x62 // todo: ?
    //var tile_y = 0x64 // todo: ?
    setCenterTile()
    var tile_x = /*199 -*/ tile_center.x
    var tile_y = tile_center.y

    var tile_offx = 272
    var tile_offy = 182

    var a2 = tile_offx // x (normally this would be cameraX aka tile_offx)
    var a3 = tile_offy // y (normally this would be cameraY aka tile_offy)

    var v3 = 200 - 1 - (tileNum % 200)
    var v4 = Math.floor(tileNum / 200)

    var v5 = Math.floor((v3 - tile_x) / -2)

    a2 += 48 * Math.ceil((v3 - tile_x) / 2) // TODO: ceil, round or floor?
    a3 += 12 * v5

    console.log("v3:", v3, "=", v3&1)

    if ( v3 & 1 )
    {
      if ( v3 > tile_x )
      {
        a2 += 32
      }
      else
      {
        a2 -= 16
        a3 += 12
      }
    }

    var v6 = v4 - tile_y
    a2 += 16 * v6
    a3 += 12 * v6

    return {x: a2, y: a3}
}
/*
function tile_coord(tileNum: number): Point {
    if(tileNum < 0 || tileNum >= 200*200)
        return null

    var tile_x = 0x62 // todo: ? this seems to be the same as tile_offx right now
    var tile_y = 0x64 // same, but for tile_offy

    var a2 = tile_x // x (normally this would be cameraX aka tile_offx)
    var a3 = tile_y // y (normally this would be cameraY aka tile_offy)

    var v3 = 200 - 1 - tileNum % 200
    var v4 = Math.floor(tileNum / 200)

    var v5 = Math.floor((v3 - tile_x) / -2)

    a2 += 48 * Math.floor((v3 - tile_x) / 2)
    a3 += 12 * v5

    if ( v3 & 1 )
    {
      if ( v3 > tile_x )
      {
        a2 += 32
      }
      else
      {
        a2 -= 16
        a3 += 12
      }
    }

    var v6 = v4 - tile_y
    a2 += 16 * v6
    a3 += 12 * v6

    return {x: a2, y: a3}
}*/

function hexToScreen(x: number, y: number): Point {
    var sx = 4816 - ((((x + 1) >> 1) << 5) + ((x >> 1) << 4) - (y << 4))
    var sy = ((12 * (x >> 1)) + (y * 12)) + 11

    return {x: sx, y: sy}
}

function hexFromScreen(x: number, y: number): Point {
    var x0 = 4800
    var y0 = 0
    var nx, ny

    if (x - x0 < 0)
        nx = (x - x0 + 1) / 16 - 1
    else
        nx = (x - x0) / 16

    if (y - y0 < 0)
        ny = (y - y0 + 1) / 12 - 1
    else
        ny = (y - y0) / 12

    if (Math.abs(nx) % 2 != Math.abs(ny) % 2)
        nx--;

    var xhBase = x0 + 16 * nx
    var yhBase = y0 + 12 * ny

    var hx = (4 * (yhBase - y0) - 3 * (xhBase - x0)) / 96
    var hy = (yhBase - y0) / 12 - hx / 2

    var dx = x - xhBase
    var dy = y - yhBase

    // XXX: Some of these cases fall through, should be inspected.

    switch(dy)
    {
      case 0:
         if (dx < 12)
         {
        hy--;
        break;
     }
     if (dx > 18)
         {
        if (hx % 2 == 1)
           hy--;
            hx--;
            break;
         }

      case 1:
         if (dx < 8)
         {
        hx--;
        break;
     }
     if (dx > 23)
         {
        if (hx % 2 == 1)
           hy--;
        hx--;
        break;
     }

      case 2:
     if (dx < 4)
         {
        hy--;
        break;
     }
         if (dx > 28)
         {
        if (hx % 2 == 1)
           hy--;
            hx--;
        break;
     }
      default:
         break;
    }


    return {x: Math.round(hx), y: Math.round(hy)}
}

function hexNeighbors(position: Point): Point[] {
    const neighbors: Point[] = []
    var x = position.x
    var y = position.y

    function n(x: number, y: number) {
        neighbors.push({x: x, y: y})
    }

    if(x % 2 === 0) {
      n(x-1,y)
      n(x-1,y+1)
      n(x,y+1)
      n(x+1,y+1)
      n(x+1,y)
      n(x,y-1)
    } else {
      n(x-1,y-1)
      n(x-1,y)
      n(x,y+1)
      n(x+1,y)
      n(x+1,y-1)
      n(x,y-1)
    }

    return neighbors
}

function hexInDirection(position: Point, dir: number): Point {
    return hexNeighbors(position)[dir]
}

function hexInDirectionDistance(position: Point, dir: number, distance: number): Point {
    if(distance === 0) {
        console.log("hexInDirectionDistance: distance=0")
        return position
    }

    var tile = hexInDirection(position, dir)
    for(var i = 0; i < distance-1; i++) // repeat for each further distance
        tile = hexInDirection(tile, dir)
    return tile
}

function directionOfDelta(xa: number, ya: number, xb: number, yb: number): number|null {
    var neighbors = hexNeighbors({x: xa, y: ya})
    for(var i = 0; i < neighbors.length; i++) {
        if(neighbors[i].x === xb && neighbors[i].y === yb)
            return i
    }

    return null
}

function hexGridToCube(grid: Point): Point3 {
    //even-q layout -> cube layout
    var z = grid.y - (grid.x + (grid.x & 1)) / 2
    var y = -grid.x - z
    return {x: grid.x, y: y, z: z}
}

function hexDistance(a: Point, b: Point): number {
    // we convert our hex coordinates into cube coordinates and then
    // we only have to see which of the 3 axes is the longest

    var cubeA = hexGridToCube(a)
    var cubeB = hexGridToCube(b)
    return Math.max(Math.abs(cubeA.x - cubeB.x),
                    Math.abs(cubeA.y - cubeB.y),
                    Math.abs(cubeA.z - cubeB.z))
}

// Direction between hexes a and b
function hexDirectionTo(a: Point, b: Point): number {
    // TODO: check correctness
    const delta = {x: b.x - a.x, y: b.y - a.y};

    if(delta.x) {
        const angle = Math.atan2(-delta.y, delta.x) * 180/Math.PI;
        let temp = 90 - angle|0;
        if(temp < 0)
            temp += 360;
        return Math.min(temp / 60|0, 5);
    }
    else if(delta.y < 0)
        return 0;
    return 2;
}

function hexOppositeDirection(direction: number) {
    return (direction + 3) % 6
}

// The adjacent hex around a nearest to b
function hexNearestNeighbor(a: Point, b: Point) {
    var neighbors = hexNeighbors(a)
    var min = Infinity, minIdx = -1
    for(var i = 0; i < neighbors.length; i++) {
        var dist = hexDistance(neighbors[i], b)
        if(dist < min) {
            min = dist
            minIdx = i
        }
    }
    if(minIdx === -1)
        return null
    return {hex: neighbors[minIdx], distance: min, direction: minIdx}
}

// Draws a line between a and b, returning the list of coordinates (including b)
function hexLine(a: Point, b: Point) {
    var path = []
    var position = {x: a.x, y: a.y}

    while(true) {
        path.push(position)
        if(position.x === b.x && position.y === b.y)
            return path
        var nearest = hexNearestNeighbor(position, b)
        if(nearest === null)
            return null
        position = nearest.hex
    }

    // throw "unreachable"
}

function hexesInRadius(center: Point, radius: number) {
    var hexes = []
    for(var x = 0; x < 200; x++) {
        for(var y = 0; y < 200; y++) {
            if(x === center.x && y === center.y) continue
            var pos = {x: x, y: y}
            if(hexDistance(center, pos) <= radius)
                hexes.push(pos)
        }
    }
    return hexes
}

function pointInBoundingBox(point: Point, bbox: BoundingBox) {
    return (bbox.x <= point.x && point.x <= bbox.x+bbox.w &&
            bbox.y <= point.y && point.y <= bbox.y+bbox.h)
}

function tile_in_tile_rect(tile: Point, a: Point, b: Point, c: Point, d: Point) {

    //our rect looks like this:
    //a - - - - b
    //.			.
    //.			.
    //.			.
    //d - - - - c
    //or like this:
    //		a
    //    .   .
    //  .       .
    //d 		  b
    //  .       .
    //    .   .
    //		c
    //these are the only possibilities that give sensical rectangles,
    // anything else involves guessing of tiles on the borders anyway
    //if I get the topmost position and check if it's below that
    //and get the downmost position and check if it's above that
    //and get the leftmost position and check if it's to the right of that
    //and the rightmost and check if it's to the left of that
    //then I do get inside a rect
    //but not a rect where my points are necessarily corner points.

    //assumption: well behaved rectangle in a grid
    //a = min x, min y
    //b = min x, max y
    //c = max x, max y
    //d = max x, min y
    var error = false
    if(c.x != d.x || a.x != b.x || a.x > c.x)
        error = true
    if(a.y != d.y || b.y != c.y || a.y > c.y)
        error = true
    if(error)
    {
        console.log("This is not a rectangle: (" + a.x +"," + a.y +"), (" + b.x +"," + b.y +"), (" + c.x +"," + c.y +"), (" + d.x +"," + d.y +")")
        return false
    }
    var inside = true
    if(tile.x <= a.x || tile.x >= c.x)
        inside = false
    if(tile.y <= a.y || tile.y >= c.y)
        inside = false

    return inside
}

function tile_in_tile_rect2(tile: Point, a: Point, c: Point) {
    var b = {x: a.x, y: c.y}
    var d = {x: c.x, y: a.y}
    return tile_in_tile_rect(tile, a, b, c, d)
}

function pointIntersectsCircle(center: Point, radius: number, point: Point): boolean {
    return Math.abs(point.x - center.x) <= radius &&
           Math.abs(point.y - center.y) <= radius
}
