import{r as e}from"./rolldown-runtime-C60lm6uB.js";import{i as t,r as n}from"./framework-BgSIrAUN.js";var r=e(n(),1),i=t(),a=.35,o=3.6,s=50;function c(e){return a+Math.max(0,Math.min(100,e))/100*(o-a)}var l=[{id:`recording`,kind:`video`,src:`/IMG_7400.mp4`,poster:`/IMG_7400-poster.jpg`,caption:`Grass Study Recording.mp4`,label:`Original footage of mounded ornamental grass moving in the wind`},{id:`pixel-map`,kind:`image`,src:`/pixel-hex-map.png`,caption:`Pixel Hex Map.png`,label:`Pixel hex color map`},{id:`relief-map`,kind:`image`,src:`/color-relief-map.png`,caption:`Color Relief Map.png`,label:`Color relief map`},{id:`gradient-map`,kind:`image`,src:`/gradient-map.png`,caption:`Gradient Map.png`,label:`Gradient color map`},{id:`topographical-map`,kind:`image`,src:`/topographical-map.png`,caption:`Topographical Map.png`,label:`Topographical terrain map`}],u=`#version 300 es
precision highp float;
layout(location=0) in vec2 aBlade;
layout(location=1) in vec3 aRoot;
layout(location=2) in vec4 aShape;
layout(location=3) in vec4 aMotion;
uniform mat4 uVP;
uniform float uTime;
uniform float uWindScale;
uniform float uStudy;
uniform sampler2D uTerrain;
out vec3 vNormal;
out vec3 vWorld;
out float vT;
out float vShade;
out float vGust;

vec2 terrainUV(vec2 xz) {
  return vec2((xz.x + 10.0) / 20.0, (12.0 - xz.y) / 34.0);
}

float terrainShape(vec2 xz) {
  vec3 sampleColor = textureLod(uTerrain, clamp(terrainUV(xz), 0.0, 1.0), 5.0).rgb;
  float luminance = dot(sampleColor, vec3(0.2126, 0.7152, 0.0722));
  return smoothstep(0.19, 0.76, luminance);
}

void main() {
  float side = aBlade.x;
  float t = aBlade.y;
  float secondStudy = step(0.5, uStudy);
  float terrainLevel = terrainShape(aRoot.xz);
  float terrainX = terrainShape(aRoot.xz + vec2(0.16, 0.0));
  float terrainZ = terrainShape(aRoot.xz + vec2(0.0, 0.16));
  float terrainStrength = mix(0.58, 0.43, secondStudy);
  float terrainY = (terrainLevel - 0.5) * terrainStrength;
  vec2 terrainGradient = vec2(terrainX - terrainLevel, terrainZ - terrainLevel) * terrainStrength / 0.16;
  vec3 terrainNormal = normalize(vec3(-terrainGradient.x, 1.0, -terrainGradient.y));
  float slopeAmount = smoothstep(0.018, 0.18, length(terrainGradient));
  vec2 downhill = normalize(-terrainGradient + vec2(0.0001));
  float height = aShape.x * mix(0.94, 1.06, terrainLevel);
  float width = aShape.y;
  vec2 radial = vec2(cos(aShape.z), sin(aShape.z));
  vec2 bladeSide = vec2(cos(aShape.w), sin(aShape.w));
  vec2 windDirection = normalize(mix(vec2(0.78, 0.63), vec2(-0.18, 0.98), secondStudy));

  vec2 frontDirection = normalize(mix(vec2(0.56, 0.83), vec2(-0.12, 0.99), secondStudy));
  vec2 frontSide = vec2(-frontDirection.y, frontDirection.x);
  float alongFront = dot(aRoot.xz, frontDirection);
  float acrossFront = dot(aRoot.xz, frontSide);
  float clumpLag = sin(aMotion.z * 1.37) * 0.52;
  float frontPhase = fract((alongFront - uTime * mix(1.06, 0.72, secondStudy) + clumpLag) / 18.0);
  float frontDistance = min(frontPhase, 1.0 - frontPhase) * 18.0;
  float primaryFront = 1.0 - smoothstep(0.75, 3.15, frontDistance);
  float primaryRegion = 0.18 + 0.82 * pow(
    sin(acrossFront * 0.31 - uTime * 0.23 + aMotion.z * 0.11) * 0.5 + 0.5,
    1.65
  );
  float secondPhase = fract((dot(aRoot.xz, vec2(-0.84, 0.54))
    - uTime * 0.68 - clumpLag * 0.42) / 23.0);
  float secondDistance = min(secondPhase, 1.0 - secondPhase) * 23.0;
  float secondFront = (1.0 - smoothstep(0.55, 2.45, secondDistance))
    * (0.24 + 0.76 * pow(sin(aRoot.x * 0.26 + uTime * 0.17) * 0.5 + 0.5, 2.0));
  float clumpBreath = sin(uTime * (0.86 + sin(aMotion.z) * 0.12) + aMotion.z)
    * 0.5 + 0.5;
  float frontResponse = 0.68 + 0.32 * (sin(aMotion.z * 1.91) * 0.5 + 0.5);
  float gust = clamp(primaryFront * primaryRegion * frontResponse
    + secondFront * 0.38, 0.0, 1.0);
  float peakGust = pow(gust, 2.20);
  float extremeWind = smoothstep(1.0, 3.6, uWindScale);
  float chaosA = sin(dot(aRoot.xz, vec2(0.91, -0.47)) * 1.16
    - uTime * 3.60 + aMotion.z * 0.72);
  float chaosB = sin(dot(aRoot.xz, vec2(-0.38, 0.96)) * 1.74
    - uTime * 4.85 + aMotion.z * 1.31);
  float chaosC = sin(dot(aRoot.xz, vec2(0.52, 0.68)) * 2.43
    + uTime * 2.95 + aMotion.x * 0.19);
  float chaosPulse = clamp(0.52 + chaosA * 0.25 + chaosB * 0.16
    + chaosC * 0.11, 0.0, 1.0);
  float individualTurn = sin(aMotion.x * 1.23 + uTime * 6.20
    + dot(aRoot.xz, vec2(0.21, -0.17)));
  vec2 crossWind = vec2(-windDirection.y, windDirection.x);
  vec2 chaoticWindDirection = normalize(windDirection
    + crossWind * (chaosA * 1.06 + individualTurn * 0.52) * extremeWind
    + radial * (chaosB * 0.46 + individualTurn * 0.26) * extremeWind);
  float wind = mix(0.11, 0.085, secondStudy)
    + gust * mix(0.48, 0.37, secondStudy)
    + clumpBreath * mix(0.10, 0.075, secondStudy)
    + secondFront * 0.045;
  wind += sin(uTime * 2.20 + aMotion.z) * 0.008
    + sin(uTime * 3.10 + aMotion.z * 0.63) * 0.004;
  wind *= mix(1.0, 0.58 + chaosPulse * 1.04, extremeWind);
  wind = clamp(wind * uWindScale, 0.05, 2.10);

  float curve = t * t;
  float arch = pow(t, 1.38);
  float tip = pow(t, 2.15);
  float taper = pow(max(1.0 - t, 0.0), 0.66);
  float lean = aMotion.w;
  vec2 bendDirection = normalize(radial * (mix(1.22, 1.58, secondStudy) - wind * mix(0.34, 0.24, secondStudy))
    + chaoticWindDirection * (mix(0.06, 0.04, secondStudy) + wind * mix(0.46, 0.34, secondStudy))
    + downhill * slopeAmount * 0.11);
  float curlAngle = sin(aMotion.x * 1.37) * 0.22 * arch
    + sin(aMotion.x * 0.71) * 0.06 * tip;
  float curlCos = cos(curlAngle);
  float curlSin = sin(curlAngle);
  vec2 curveDirection = vec2(
    bendDirection.x * curlCos - bendDirection.y * curlSin,
    bendDirection.x * curlSin + bendDirection.y * curlCos
  );
  vec2 rippleDirection = vec2(-chaoticWindDirection.y, chaoticWindDirection.x);
  float bladeFlutter = sin(aMotion.x * 1.71 + uTime * 5.40 + t * 3.2)
    + sin(aMotion.x * 0.83 - uTime * 7.10 + t * 5.1) * 0.46;
  float ripple = sin(aMotion.x + uTime * 1.74 + t * 2.7) * 0.006 * height
    + bladeFlutter * extremeWind * height * (0.020 + gust * 0.028);

  float naturalReach = height * (0.050 * t + lean * mix(0.62, 0.72, secondStudy) * arch);
  float gustReach = height * wind * (
    0.12 + gust * 0.10 + peakGust * 0.18
    + extremeWind * (0.09 + gust * 0.16 + peakGust * 0.22)
  ) * curve * mix(1.0, 0.78, secondStudy);
  vec3 world = aRoot;
  world.y += terrainY;
  // Both vegetation layers emerge from the hidden terrain normal before
  // gravity and wind bend them across the surface.
  world.xz += terrainNormal.xz * height * t * (0.30 - arch * 0.08);
  world.xz += curveDirection * naturalReach;
  world.xz += chaoticWindDirection * gustReach;
  world.xz += rippleDirection * ripple * tip;
  float verticalLift = max(0.018,
    1.0 - lean * mix(0.58, 0.76, secondStudy) * arch
      - wind * mix(0.16, 0.11, secondStudy) * tip
      - peakGust * mix(0.42, 0.30, secondStudy) * tip
      - extremeWind * (0.28 + gust * 0.20 + peakGust * 0.38) * tip
      - extremeWind * abs(chaosB) * 0.14 * tip
  );
  world.y += height * t * verticalLift * terrainNormal.y;
  world.xz += bladeSide * side * width * taper;

  vec2 horizontalTangent = curveDirection * (lean * 1.02 + 0.08)
    + chaoticWindDirection * (wind * (0.36 + gust * 0.14) + peakGust * 0.42
      + extremeWind * (0.34 + gust * 0.38 + peakGust * 0.62))
    + rippleDirection * chaosC * extremeWind * 0.38;
  vec3 tangent = normalize(vec3(
    horizontalTangent.x * arch + terrainNormal.x * (1.0 - arch) * 0.34,
    max(0.018, 1.0 - lean * 0.70 * arch - wind * 0.28 * tip - peakGust * 0.48 * tip
      - extremeWind * (0.34 + peakGust * 0.44) * tip)
      * terrainNormal.y,
    horizontalTangent.y * arch + terrainNormal.z * (1.0 - arch) * 0.34
  ));
  vNormal = normalize(cross(vec3(bladeSide.x, 0.0, bladeSide.y), tangent));
  vWorld = world;
  vT = t;
  vShade = aMotion.y;
  vGust = gust * 0.78 + wind * 0.22;
  gl_Position = uVP * vec4(world, 1.0);
}`,d=`#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vWorld;
in float vT;
in float vShade;
in float vGust;
uniform vec3 uCamera;
uniform float uStudy;
uniform sampler2D uReferenceColorField;
uniform sampler2D uGeneratedGradientField;
uniform vec2 uResolution;
out vec4 outColor;

void main() {
  float secondStudy = step(0.5, uStudy);
  vec3 normal = normalize(gl_FrontFacing ? vNormal : -vNormal);
  vec3 sun = normalize(vec3(-0.54, 0.78, 0.32));
  vec3 view = normalize(uCamera - vWorld);
  vec3 halfDirection = normalize(sun + view);
  float direct = max(dot(normal, sun), 0.0);
  float translucent = pow(max(dot(-normal, sun), 0.0), 1.2);
  float specular = pow(max(dot(normal, halfDirection), 0.0), 28.0);
  float silverEdge = pow(1.0 - abs(dot(normal, view)), 7.0);

  // Palette sampled from the target half of the pixel comparison:
  // #192818, #2e3e26, #384a3a, #62734d, #76863d, #a0ae55,
  // #a1ac74, #afb884, #c6d098.
  vec3 root = vec3(0.0980, 0.1569, 0.0941);
  vec3 shadowBlade = vec3(0.1804, 0.2431, 0.1490);
  vec3 coolBlade = vec3(0.2196, 0.2902, 0.2275);
  vec3 naturalBlade = vec3(0.4314, 0.5216, 0.2588);
  vec3 freshBlade = vec3(0.5765, 0.6549, 0.2510);
  vec3 oliveBlade = vec3(0.4784, 0.5373, 0.2627);
  vec3 grayBlade = vec3(0.6863, 0.7412, 0.5569);
  vec3 strawBlade = vec3(0.7608, 0.7529, 0.5216);
  vec3 paleBlade = vec3(0.8549, 0.8941, 0.7137);
  vec3 silver = vec3(0.9608, 0.9765, 0.9098);

  float accentPlant = step(2.0, vShade);
  float flattened = step(1.0, vShade) * (1.0 - accentPlant);
  float shade = fract(vShade);
  float strandFlash = smoothstep(0.72, 0.97, fract(shade * 29.73));
  vec3 color = shade < 0.14 ? coolBlade
    : (shade < 0.32 ? naturalBlade
    : (shade < 0.52 ? freshBlade
    : (shade < 0.68 ? oliveBlade
    : (shade < 0.84 ? grayBlade : strawBlade))));
  float dryFamily = smoothstep(0.60, 0.93, shade);
  vec3 weathered = fract(shade * 13.71) < 0.52 ? strawBlade : grayBlade;
  color = mix(color, weathered, dryFamily * 0.74);
  // Study 02 keeps the same families but pulls their base values toward the
  // quieter olive/sage character of the second recording. Sunlight can still
  // reveal pale strands later without turning the whole cushion lime.
  float familyLuma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  vec3 studyTwoMuted = mix(
    vec3(0.185, 0.255, 0.155),
    vec3(0.625, 0.660, 0.455),
    smoothstep(0.10, 0.72, familyLuma)
  );
  color = mix(color, studyTwoMuted, secondStudy * 0.24);
  // Trough blades stay cool and dark, but retain the same separated strand
  // shading as the lit mounds instead of fading into a pale floor-like mat.
  color = mix(color, mix(shadowBlade, coolBlade, 0.62),
    flattened * (0.34 + dryFamily * 0.16));
  color *= mix(0.82, 1.12, fract(shade * 7.31));
  vec3 accentRoot = vec3(0.2784, 0.3216, 0.0471);
  vec3 accentLeaf = mix(
    vec3(0.6196, 0.6902, 0.0235),
    vec3(0.8706, 0.8549, 0.0745),
    shade
  );
  color = mix(color, accentLeaf, accentPlant);
  vec3 rootColor = mix(root, accentRoot, accentPlant);
  color = mix(rootColor, color, smoothstep(0.05, 0.44, vT));
  color = mix(color, shadowBlade, (1.0 - smoothstep(0.03, 0.26, vT)) * 0.20);
  float sunWash = smoothstep(0.48, 0.96, direct) * smoothstep(0.44, 1.0, vT);
  color = mix(color, paleBlade,
    sunWash * (0.25 + flattened * 0.06) * mix(1.0, 0.76, secondStudy));
  float illumination = 0.70 + direct * 0.72 + translucent * 0.18 + vGust * 0.016;
  color *= illumination;
  color += paleBlade * silverEdge * (0.080 + vT * 0.185)
    * mix(1.0, 0.82, secondStudy);
  color += silver * strandFlash * direct * 0.48 * smoothstep(0.16, 1.0, vT)
    * mix(1.0, 0.76, secondStudy);
  color += silver * specular * (1.10 + vGust * 0.36) * smoothstep(0.20, 1.0, vT)
    * mix(1.0, 0.78, secondStudy);
  color *= mix(1.0, 1.06, smoothstep(0.16, 0.78, vT));

  // Subtle screen-space color inheritance from the blurred real reference.
  // The renderer retains its high-frequency blade lighting and specular detail.
  vec2 fieldUV = clamp(gl_FragCoord.xy / uResolution, 0.0, 1.0);
  vec3 referenceField = texture(uReferenceColorField, fieldUV).rgb;
  float referenceLuma = dot(referenceField, vec3(0.2126, 0.7152, 0.0722));
  float sourceLuma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  vec3 referenceChroma = referenceField / max(referenceLuma, 0.055);
  float spatialLuma = mix(sourceLuma, referenceLuma, 0.28);
  vec3 spatialTint = referenceChroma * spatialLuma;
  color = mix(color, spatialTint, mix(0.34, 0.40, secondStudy));

  // Gentle value refinement only: lift midtones and reflected sunlight while
  // preserving the restrained reference-field palette and existing shading.
  float tintedLuma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float midtoneMask = smoothstep(0.14, 0.34, tintedLuma)
    * (1.0 - smoothstep(0.62, 0.84, tintedLuma));
  color *= 1.0 + midtoneMask * 0.075;

  float sunlitBlade = smoothstep(0.42, 0.92, direct)
    * smoothstep(0.25, 1.0, vT);
  float reflectedFlash = clamp(
    0.16 + silverEdge * 0.38 + strandFlash * 0.24 + specular * 0.45,
    0.0, 1.0
  );
  color += vec3(0.043, 0.052, 0.046) * sunlitBlade * reflectedFlash;

  float lowerHalf = 1.0 - smoothstep(0.38, 0.76, fieldUV.y);
  float strawVariation = clamp(lowerHalf * 0.55 + flattened * 0.70, 0.0, 1.0)
    * dryFamily * smoothstep(0.30, 1.0, vT);
  color = mix(color, vec3(0.67, 0.63, 0.50),
    strawVariation * mix(0.085, 0.15, secondStudy));

  float refinedLuma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float shadowLift = 1.0 - smoothstep(0.11, 0.29, refinedLuma);
  color += vec3(0.016, 0.022, 0.018) * shadowLift;

  // The supplied blurred comparison provides an explicit low-frequency
  // correction at every screen coordinate. Apply most of that measured
  // difference while retaining the blade-scale lighting variation.
  vec3 generatedGradientField = texture(uGeneratedGradientField, fieldUV).rgb;
  float generatedGradientLuma = dot(
    generatedGradientField, vec3(0.2126, 0.7152, 0.0722)
  );
  vec3 generatedGradientChroma = generatedGradientField
    / max(generatedGradientLuma, 0.055);
  vec3 chromaRatio = clamp(
    referenceChroma / max(generatedGradientChroma, vec3(0.16)),
    vec3(0.78), vec3(1.22)
  );
  color *= mix(vec3(1.0), chromaRatio, 0.24);

  float comparisonLuma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float spatialValueOffset = (referenceLuma - generatedGradientLuma) * 0.72;
  float correctedLuma = clamp(comparisonLuma + spatialValueOffset, 0.052, 0.965);
  color *= correctedLuma / max(comparisonLuma, 0.032);
  color = min(color, silver);
  // Absolute simulator shadow floor requested by the study: no rendered grass
  // fragment may become darker than #001E08.
  color = max(color, vec3(0.0, 0.117647, 0.031373));
  outColor = vec4(color, 1.0);
}`,f=[[-5.55,-18.42,.92,.66,-.18,.45,.64,.86,.32,.86],[-3.46,-18.82,1.04,.72,.31,.72,.71,.94,.61,.92],[-1.17,-18.26,.88,.82,-.4,.55,.76,.79,.44,1],[.77,-18.73,1.12,.68,.24,.88,.69,.9,.74,.88],[3.02,-18.18,.91,.76,-.28,.38,.79,.82,.4,.95],[5.29,-18.61,1.04,.7,.42,.7,.65,.88,.58,.9],[-4.78,-16.06,1.16,.82,.18,.4,.68,.92,.56,.95],[-2.48,-15.72,.98,.96,-.38,.86,.72,.84,.35,1.02],[-.24,-16.31,1.25,.84,.26,.6,.8,.93,.7,.9],[2.18,-15.62,1.06,.92,-.16,.95,.66,.88,.47,1],[4.57,-16.16,1.18,.84,.34,.5,.75,.95,.65,.94],[-5.37,-13.62,1.12,.91,-.28,.76,.74,.81,.42,1.04],[-3.23,-14.08,1.27,.86,.36,.32,.67,.95,.68,.91],[-.82,-13.42,1.1,1.02,-.18,.98,.83,.89,.36,.98],[1.42,-13.93,1.31,.88,.3,.62,.7,.96,.59,1.05],[3.74,-13.36,1.08,1,-.42,.84,.78,.86,.76,.92],[5.62,-14.02,.98,.86,.22,.48,.64,.79,.48,1.02],[-4.73,-11.05,1.38,.99,.31,.88,.7,.94,.62,1.03],[-2.11,-11.52,1.17,1.12,-.36,.42,.84,.82,.34,.94],[.26,-10.87,1.44,.96,.14,1.02,.76,.97,.71,1.08],[2.88,-11.41,1.25,1.13,-.24,.6,.69,.88,.49,.96],[5.12,-10.71,1.33,.94,.39,.78,.81,.91,.66,1.01],[-5.36,-8.54,1.42,1.14,-.21,.36,.78,.86,.45,1.06],[-2.73,-8.97,1.51,1.02,.29,.91,.66,.96,.72,.98],[-.08,-8.24,1.31,1.24,-.35,.56,.88,.87,.3,1],[2.43,-8.82,1.55,1.07,.2,1.05,.74,.95,.61,1.1],[5.07,-8.18,1.41,1.18,-.32,.69,.82,.89,.51,.94],[-4.65,-5.83,1.68,1.22,.27,.82,.42,.93,.69,1.1],[-1.63,-6.31,1.48,1.36,-.41,.4,.86,.84,.38,.96],[1.13,-5.48,1.72,1.19,.18,.98,.52,.98,.58,1.16],[4.24,-6.02,1.59,1.31,-.28,.58,.73,.91,.47,1],[-5.2,-2.64,1.74,1.43,-.34,.36,.85,.87,.4,1.03],[-2.01,-3.17,2.02,1.42,.24,.86,.46,.97,.71,1.18],[1.19,-2.32,1.66,1.55,-.26,.52,.91,.9,.31,.98],[4.34,-3.03,1.88,1.34,.35,1,.78,.95,.6,1.08],[-4.53,.66,2.04,1.42,.2,.78,.58,.92,.64,1.1],[-.98,-.15,2.42,1.74,-.38,.39,.34,.98,.62,1.2],[2.75,.74,2.1,1.46,.29,.96,.66,.94,.57,1.14],[5.76,-.04,1.48,1.34,-.24,.55,.7,.78,.48,.95],[-5.02,4.16,2.13,1.63,-.29,.32,.9,.88,.43,1.04],[-1.32,3.48,2.55,1.85,.24,.84,.46,.98,.68,1.18],[2.58,4.43,2.24,1.58,-.36,.5,.94,.92,.32,1],[6.05,3.71,1.63,1.48,.31,1.02,.77,.8,.56,1.06],[-4.02,7.79,2.62,1.82,.26,.72,.94,.9,.54,1.05],[.31,7.18,2.72,1.93,-.33,.34,.88,.99,.39,1.1],[4.62,7.92,2.56,1.74,.2,.91,.96,.93,.65,1],[-1.95,-12.52,2.12,.3,-.22,.22,.98,.22,.49,.67],[3.45,-9.78,2.42,.34,.18,.91,.99,.26,.62,.71],[-3.18,-7.14,2.28,.36,-.31,.4,.97,.24,.44,.72],[1.86,-4.39,2.62,.38,.27,.78,.99,.28,.68,.66],[-2.44,-.94,2.75,.42,-.24,.28,.98,.3,.52,.7],[2.04,2.37,3.02,.45,.2,.88,.99,.33,.72,.64],[-1.06,6.02,3.32,.52,-.18,.38,.99,.34,.57,.68],[-3.92,-15.06,1.86,.42,.38,.62,.97,.34,.42,.62],[1.58,-12.04,2.42,.5,-.33,.25,.99,.36,.58,.58],[-.62,-8.68,3.04,.62,.18,.82,.98,.38,.46,.62],[3.08,-5.76,2.74,.68,-.25,.42,.99,.36,.66,.58],[-3.18,-3.02,3.12,.78,.3,.95,.98,.38,.52,.6],[.42,.38,3.82,.92,-.18,.35,.99,.38,.62,.56],[-1.68,3.72,4.58,1.05,.22,.78,.99,.39,.5,.54],[1.04,7.08,5.96,1.34,-.12,.28,.99,.39,.59,.52]],p=[[-4.82,-18.62,3.2,.82,.18,.18,.82,.95,.56,.96],[-.18,-18.34,3.46,.92,-.12,.72,.76,.99,.68,1.02],[4.78,-18.56,3.02,.78,.22,.36,.88,.94,.62,.94],[-5.24,-15.52,3.05,.94,-.24,.86,.9,.96,.58,1],[-.54,-15.84,3.92,1.02,.16,.3,.78,1,.71,1.08],[4.68,-15.36,3.22,.88,-.18,.62,.84,.97,.64,.98],[-4.16,-12.18,3.62,1.08,.28,.42,.76,.98,.54,1.04],[1.52,-12.48,4.08,1.16,-.22,.96,.88,1,.7,1.1],[5.74,-11.88,2.42,.82,.18,.26,.92,.92,.6,.94],[-5.16,-8.72,3.04,1.02,-.28,.74,.86,.96,.62,1],[-.44,-9.14,4.2,1.22,.2,.34,.8,1,.72,1.12],[4.78,-8.48,3.28,1.04,-.16,.88,.94,.98,.58,1.02],[-3.92,-5.42,3.82,1.26,.24,.28,.78,1,.56,1.08],[2.34,-5.78,4.18,1.18,-.26,.82,.9,1,.7,1.14],[6.08,-5.14,2.2,.82,.14,.48,.84,.9,.62,.96],[-5.22,-1.86,3.18,1.12,-.18,.94,.88,.97,.6,1.04],[-.22,-2.22,4.34,1.34,.22,.38,.8,1,.73,1.14],[5.02,-1.54,3.34,1.08,-.22,.68,.92,.98,.66,1.06],[-3.86,1.82,4.12,1.38,.26,.3,.82,1,.64,1.12],[2.62,2.16,4.26,1.32,-.24,.88,.9,1,.7,1.16],[6.16,1.54,2.24,.9,.16,.46,.86,.92,.58,.98],[-5.06,5.58,3.44,1.24,-.2,.78,.92,.98,.62,1.08],[-.12,5.2,4.52,1.48,.2,.34,.84,1,.74,1.18],[5.08,5.82,3.52,1.26,-.18,.94,.9,.99,.6,1.08],[-3.42,8.52,4.72,1.54,.18,.4,.86,1,.68,1.16],[3.66,8.26,4.56,1.48,-.2,.82,.94,1,.72,1.18]],m=f.filter(e=>e[7]>=.405);function h(e,t,n){let r=e.createShader(t);if(!r)throw Error(`Could not create shader`);if(e.shaderSource(r,n),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS)){let t=e.getShaderInfoLog(r)||`Shader compilation failed`;throw e.deleteShader(r),Error(t)}return r}function g(e,t,n){let r=e.createProgram();if(!r)throw Error(`Could not create program`);let i=h(e,e.VERTEX_SHADER,t),a=h(e,e.FRAGMENT_SHADER,n);if(e.attachShader(r,i),e.attachShader(r,a),e.linkProgram(r),e.deleteShader(i),e.deleteShader(a),!e.getProgramParameter(r,e.LINK_STATUS))throw Error(e.getProgramInfoLog(r)||`Program linking failed`);return r}function _(e){let t=Math.hypot(...e)||1;return[e[0]/t,e[1]/t,e[2]/t]}function v(e,t){return[e[1]*t[2]-e[2]*t[1],e[2]*t[0]-e[0]*t[2],e[0]*t[1]-e[1]*t[0]]}function y(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]}function b(e,t){let n=_([e[0]-t[0],e[1]-t[1],e[2]-t[2]]),r=_(v([0,1,0],n)),i=v(n,r);return new Float32Array([r[0],i[0],n[0],0,r[1],i[1],n[1],0,r[2],i[2],n[2],0,-y(r,e),-y(i,e),-y(n,e),1])}function x(e){let t=.1,n=1/Math.tan(Math.PI*.116),r=1/(t-48);return new Float32Array([n/e,0,0,0,0,n,0,0,0,0,(t+48)*r,-1,0,0,t*48*2*r,0])}function S(e,t){let n=new Float32Array(16);for(let r=0;r<4;r+=1)for(let i=0;i<4;i+=1)n[r*4+i]=e[i]*t[r*4]+e[4+i]*t[r*4+1]+e[8+i]*t[r*4+2]+e[12+i]*t[r*4+3];return n}function C(e,t){let n=Math.sin(e*127.1+t*311.7)*43758.5453;return n-Math.floor(n)}function w(e,t,n){let r=e.createVertexArray(),i=e.createBuffer(),a=e.createBuffer();if(!r||!i||!a)throw Error(`Grass allocation failed`);let o=new Float32Array(32);for(let e=0;e<=7;e+=1)o.set([-1,e/7,1,e/7],e*4);let s=n===`study-7401`,c=s?p:m,l=(e,t)=>e[2]*e[3]*e[7]*(e[7]<.405?.82:1)*(.68+C(t,31)*.72),u=c.reduce((e,t,n)=>e+l(t,n),0),d=c.map((e,n)=>Math.floor(t*l(e,n)/u)),f=d.reduce((e,t)=>e+t,0);for(let e=0;f<t;e=(e+1)%d.length)d[e]+=1,f+=1;let h=new Float32Array(f*11),g=0;c.forEach(([e,t,n,r,i,a,o,c,l,u,f=0],p)=>{let m=C(p,20)*Math.PI*2,_=Math.max(0,Math.min(1,(t+2)/10)),v=Math.cos(i),y=Math.sin(i),b=a+(C(p,22)-.5)*(s?2.18:3.1),x=Math.cos(b),S=Math.sin(b),w=Math.sqrt(n*r),T=+(c<.405),E=C(p,32),D=T>.5?0:+(E<(s?.18:.29)),O=T>.5?0:+(E>(s?.65:.76)),k=D>.5?s?1.1:1.22:O>.5?s?.76:.66:.94,A=D>.5?s?1.18:1.24:O>.5?s?.52:.54:.9,j=D>.5?.88:O>.5?s?1.16:1.18:1,M=k*(.82+C(p,15)*.38),N=(C(p,16)-.5)*.42-D*.16+O*.3,P=e+(C(p,17)-.5)*.42,F=t+(C(p,18)-.5)*.54;for(let e=0;e<d[p];e+=1){let e=g*11,t=C(g,1)*Math.PI*2,i=C(g,2),a=C(g,17)<.55?i**1.42*.9:i**.72,c=s?1.22:1,d=1+Math.sin(t*3+m)*.18*c+Math.sin(t*5-m*.63)*.11*c,E=Math.cos(t)*a*n*d*.96*j,k=Math.sin(t)*a*r*d*.96*(O>.5?1.08:D>.5?.92:1),I=C(g,14),L=I<.28?-1:+(I>.72),R=I<.16?-.7:I>.84?.55:0,z=E*v-k*y-S*L*n*.13+x*R*r*.08,B=E*y+k*v+x*L*n*.13+S*R*r*.08,V=Math.hypot(z,B)||1,ee=z/V,te=B/V,H=T,ne=H>.5?.4:s?.5:.92,re=H>.5?.18:s?.24:.36,ie=Math.floor(t/(Math.PI*2)*6),U=p*13+ie,ae=s?(C(U,60)-.5)*1.06:0,oe=s?.86+C(U,61)*.28:1,se=s?(C(U,62)-.5)*.3:0,W=b+Math.sin(t*2+m)*ne+Math.sin(t*5-m*.72)*re+ae,G=Math.cos(W),ce=Math.sin(W),le=G*.84+ee*.16,ue=ce*.84+te*.16,K=+(C(g,19)<(s?.35:.27)+H*.12),q=Math.atan2(ue,le)+(C(g,5)-.5)*(H>.5?.38:s?.48:.64)+K*(C(g,20)-.5)*1.82,de=.82+C(g,3)**.82*.42,fe=Math.max(.72,Math.min(1.12,.9+Math.sin(t*2+m)*.12+Math.sin(t*5-m*.71)*.07)),pe=C(g,13)>.93?1.14:C(g,13)<.17?.72:1,J=+(C(g,21)<.36),Y=+(a>.48&&Math.sin(t*3+m)>.42),me=.9+(1-a)*.12+Math.max(-.13,Math.min(.13,(z*x+B*S)/w*.12)),X=(w<=1.45?w:1.45+(w-1.45)*.28)*(s?.9:.98)*de*me*fe*pe*u*M*oe*(1-_*.1)*(1-H*.24)*(1-Y*.23)*(1-J*.19)*(1-K*.06),Z=P+z,he=F+B;f>.5&&(X*=.76);let ge=.018+Math.max(0,1-a)**1.12*w*(s?.22:.36)*A*(1-H*.84)+(1-a)*.045*(1-o*.54)+C(g,12)*.018;h[e]=Z,h[e+1]=ge,h[e+2]=he,h[e+3]=X,h[e+4]=f>.5?.011+C(g,4)*.009:s?.006+C(g,4)*.0052:(.0048+C(g,4)*.0047)*(1+J*.1),h[e+5]=q,h[e+6]=q+Math.PI*.5+(C(g,6)-.5)*.62,h[e+7]=C(g,7)*Math.PI*2;let Q=C(g,11),$=Math.max(.06,Math.min(.98,l*.68+C(g,8)*.28+_*.08+(Q>.72?.24:0)-(Q<.11?.13:0)));h[e+8]=f>.5?2+$:$+H,h[e+9]=m,h[e+10]=Math.max(.26,Math.min(.98,.14+o*.48+_*.03+a*.13+N+Math.sin(t*2+m)*.075+Math.sin(t*5-m)*.035+se+H*.46+Y*.16-J*.07+K*.07+(C(g,9)-.5)*.32)),g+=1}}),e.bindVertexArray(r),e.bindBuffer(e.ARRAY_BUFFER,i),e.bufferData(e.ARRAY_BUFFER,o,e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.bindBuffer(e.ARRAY_BUFFER,a),e.bufferData(e.ARRAY_BUFFER,h,e.STATIC_DRAW);let _=11*Float32Array.BYTES_PER_ELEMENT;for(let[t,n,r]of[[1,3,0],[2,4,3],[3,4,7]])e.enableVertexAttribArray(t),e.vertexAttribPointer(t,n,e.FLOAT,!1,_,r*4),e.vertexAttribDivisor(t,1);return e.bindVertexArray(null),{vao:r,bladeBuffer:i,instanceBuffer:a,vertices:16,count:f}}function T(e,t,n){let r=e.createVertexArray(),i=e.createBuffer(),a=e.createBuffer();if(!r||!i||!a)throw Error(`Base grass allocation failed`);let o=new Float32Array(24);for(let e=0;e<=5;e+=1)o.set([-1,e/5,1,e/5],e*4);let s=16.8,c=Math.max(1,Math.round(Math.sqrt(t*s/35))),l=Math.max(1,Math.ceil(t/c)),u=c*l,d=new Float32Array(u*11),f=n===`study-7401`,p=0;for(let e=0;e<l;e+=1)for(let t=0;t<c;t+=1){let n=p*11,r=-8.4+(t+.16+C(p,41)*.68)/c*s,i=-23+(e+.16+C(p,42)*.68)/l*35,a=Math.floor((r+8.4)/1.22),o=Math.floor((i+23)/1.36)*19+a,u=C(o,43)*Math.PI*2,m=C(o,44),h=u+Math.sin(r*.24+i*.11)*.38+Math.cos(i*.19-r*.07)*.24,g=+(C(p,45)<.17+m*.16),_=h+(C(p,46)-.5)*(f?.52:.78)+g*(C(p,47)-.5)*1.72,v=m>.72?.68:m<.2?1.08:.88,y=(f?.48+C(p,48)*.42:.42+C(p,48)*.48)*v,b=Math.max(.04,Math.min(.94,(f?.17:.09)+C(p,49)*.54+(m<.18?.18:0)));d[n]=r,d[n+1]=.01+C(p,50)*.014,d[n+2]=i,d[n+3]=y,d[n+4]=f?.0074+C(p,51)*.005:.0046+C(p,51)*.0042,d[n+5]=_,d[n+6]=_+Math.PI*.5+(C(p,52)-.5)*.48,d[n+7]=C(p,53)*Math.PI*2,d[n+8]=1+b,d[n+9]=u,d[n+10]=Math.max(.28,Math.min(.98,(f?.68:.48)+m*(f?.24:.28)+(C(p,54)-.5)*.2+g*.08)),p+=1}e.bindVertexArray(r),e.bindBuffer(e.ARRAY_BUFFER,i),e.bufferData(e.ARRAY_BUFFER,o,e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.bindBuffer(e.ARRAY_BUFFER,a),e.bufferData(e.ARRAY_BUFFER,d,e.STATIC_DRAW);let m=11*Float32Array.BYTES_PER_ELEMENT;for(let[t,n,r]of[[1,3,0],[2,4,3],[3,4,7]])e.enableVertexAttribArray(t),e.vertexAttribPointer(t,n,e.FLOAT,!1,m,r*4),e.vertexAttribDivisor(t,1);return e.bindVertexArray(null),{vao:r,bladeBuffer:i,instanceBuffer:a,vertices:12,count:u}}function E(e,t){let n=e.createTexture();if(!n)throw Error(`Terrain texture allocation failed`);e.bindTexture(e.TEXTURE_2D,n),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,new Uint8Array([132,111,78,255]));let r=new Image;return r.decoding=`async`,r.onload=()=>{e.bindTexture(e.TEXTURE_2D,n),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!0),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,r),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1)},r.src=t,{texture:n,image:r}}function D(e,t,n){let r=e.createTexture();if(!r)throw Error(`Color field texture allocation failed`);e.bindTexture(e.TEXTURE_2D,r),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR_MIPMAP_LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,new Uint8Array(n)),e.generateMipmap(e.TEXTURE_2D);let i=new Image;return i.decoding=`async`,i.onload=()=>{e.bindTexture(e.TEXTURE_2D,r),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!0),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,i),e.generateMipmap(e.TEXTURE_2D),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1)},i.src=t,{texture:r,image:i}}function O(e,t,n){let r=e.getContext(`webgl2`,{antialias:!0,alpha:!1,depth:!0,powerPreference:`high-performance`});if(!r)return;let i=n===`study-7401`,s=[0,10.2,8],c=g(r,u,d),l=matchMedia(`(max-width:700px)`).matches,f=T(r,l?i?16e4:112e3:i?264e3:188e3,n),p=w(r,l?i?94e3:82e3:i?154e3:136e3,n),m=E(r,i?`./IMG_7401-terrain.png`:`./topography-terrain.png`),h=D(r,i?`./IMG_7401-color-field.png`:`./reference-color-field-v2.png`,i?[119,148,62,255]:[118,132,75,255]),_=D(r,i?`./IMG_7401-color-field.png`:`./generated-gradient-field.png`,i?[119,148,62,255]:[107,123,68,255]),v=b(s,[0,.3,-2.35]),y=r.getUniformLocation(c,`uVP`),C=r.getUniformLocation(c,`uTerrain`),O=r.getUniformLocation(c,`uReferenceColorField`),k=r.getUniformLocation(c,`uGeneratedGradientField`),A=r.getUniformLocation(c,`uResolution`),j=r.getUniformLocation(c,`uTime`),M=r.getUniformLocation(c,`uWindScale`),N=r.getUniformLocation(c,`uStudy`),P=r.getUniformLocation(c,`uCamera`);if(!y||!C||!O||!k||!A||!j||!M||!N||!P)throw Error(`Missing uniforms`);let F=0,I=0,L=performance.now(),R=n=>{let l=Math.min(Math.max((n-L)/1e3,0),.05);L=n;let u=t.current,d=.45+Math.max(0,Math.min(1,(u-a)/(o-a)))*4.75;I+=l*d;let g=e.getBoundingClientRect(),b=Math.min(devicePixelRatio||1,2.25),w=Math.max(1,Math.round(g.width*b)),T=Math.max(1,Math.round(g.height*b));(e.width!==w||e.height!==T)&&(e.width=w,e.height=T),r.viewport(0,0,w,T);let E=S(x(w/T),v);r.enable(r.DEPTH_TEST),r.depthFunc(r.LEQUAL),r.disable(r.CULL_FACE),r.clearColor(0,.117647,.031373,1),r.clear(r.COLOR_BUFFER_BIT|r.DEPTH_BUFFER_BIT),r.activeTexture(r.TEXTURE0),r.bindTexture(r.TEXTURE_2D,m.texture),r.activeTexture(r.TEXTURE1),r.bindTexture(r.TEXTURE_2D,h.texture),r.activeTexture(r.TEXTURE2),r.bindTexture(r.TEXTURE_2D,_.texture),r.useProgram(c),r.uniformMatrix4fv(y,!1,E),r.uniform1i(C,0),r.uniform1i(O,1),r.uniform1i(k,2),r.uniform2f(A,w,T),r.uniform1f(j,I),r.uniform1f(M,u),r.uniform1f(N,+!!i),r.uniform3fv(P,s),r.bindVertexArray(f.vao),r.drawArraysInstanced(r.TRIANGLE_STRIP,0,f.vertices,f.count),r.bindVertexArray(p.vao),r.drawArraysInstanced(r.TRIANGLE_STRIP,0,p.vertices,p.count),F=requestAnimationFrame(R)};return F=requestAnimationFrame(R),()=>{cancelAnimationFrame(F),r.deleteBuffer(f.bladeBuffer),r.deleteBuffer(f.instanceBuffer),r.deleteVertexArray(f.vao),r.deleteBuffer(p.bladeBuffer),r.deleteBuffer(p.instanceBuffer),r.deleteVertexArray(p.vao),m.image.onload=null,r.deleteTexture(m.texture),h.image.onload=null,r.deleteTexture(h.texture),_.image.onload=null,r.deleteTexture(_.texture),r.deleteProgram(c)}}function k(){let e=(0,r.useRef)(null),t=(0,r.useRef)(c(s)),n=(0,r.useRef)({active:!1,left:0,width:1,lastX:0,lastTime:0,velocity:0}),a=`study-7400`,[o,u]=(0,r.useState)(`recording`),[d,f]=(0,r.useState)(s),[p,m]=(0,r.useState)(0),[h,g]=(0,r.useState)(!1);(0,r.useEffect)(()=>{if(e.current)try{return O(e.current,t,a)}catch(e){console.error(`Unable to start the ornamental grass field`,e)}},[a]);let _=l.find(e=>e.id===o)??l[0],v=l,y=`${d}%`,b=e=>{let n=Math.max(0,Math.min(100,e));t.current=c(n),f(n)};return(0,i.jsxs)(`div`,{className:`grass-comparison`,children:[(0,i.jsx)(`section`,{className:`grass-experience`,"aria-label":`Generated grass simulation`,children:(0,i.jsxs)(`div`,{className:`generated-stage-shell`,children:[(0,i.jsxs)(`figure`,{className:`grass-stage generated-stage`,children:[(0,i.jsx)(`canvas`,{ref:e,className:`grass-canvas`,role:`img`,"aria-label":`Mounded ornamental grass moving continuously in layered coastal wind`}),(0,i.jsx)(`div`,{className:`grass-fallback`,"aria-hidden":`true`}),(0,i.jsx)(`figcaption`,{className:`visually-hidden`,children:`Dense mounds of fine ornamental grass moving continuously in bright coastal wind.`})]}),(0,i.jsx)(`div`,{className:`wind-drawer${h?` is-dragging`:``}`,style:{"--wind-fill":y,"--wind-pull":`${p*.725}px`,"--wind-stretch":1+Math.abs(p)*.003,transformOrigin:p<0?`right center`:`left center`},children:(0,i.jsxs)(`label`,{className:`wind-control${d>=100?` is-max`:``}`,children:[(0,i.jsxs)(`span`,{className:`wind-control__progress`,"aria-hidden":`true`,children:[(0,i.jsx)(`span`,{className:`wind-control__filled-label`,"aria-hidden":`true`,children:`Wind`}),(0,i.jsx)(`span`,{className:`wind-control__filled-marker`})]}),(0,i.jsx)(`span`,{className:`wind-control__empty-marker`,"aria-hidden":`true`}),(0,i.jsx)(`span`,{className:`wind-control__label`,"aria-hidden":`true`,children:`Wind`}),(0,i.jsx)(`output`,{className:`wind-control__value`,children:Math.round(d)}),(0,i.jsx)(`input`,{className:`wind-control__range`,type:`range`,min:`0`,max:`100`,step:`1`,value:d,"aria-label":`Wind strength`,"aria-valuetext":`${Math.round(d)} out of 100`,onChange:e=>{b(Number(e.currentTarget.value))},onPointerDown:e=>{e.preventDefault();let t=e.currentTarget,r=t.getBoundingClientRect(),i=performance.now();n.current={active:!0,left:r.left,width:r.width,lastX:e.clientX,lastTime:i,velocity:0},t.focus(),t.setPointerCapture(e.pointerId),g(!0),m(0),b((e.clientX-r.left)/r.width*100)},onPointerMove:e=>{if(!n.current.active)return;let t=performance.now(),r=Math.max(1,t-n.current.lastTime),i=(e.clientX-n.current.lastX)/r,a=(e.clientX-n.current.left)/n.current.width,o=a<0?a*n.current.width:a>1?(a-1)*n.current.width:0,s=a<=0&&i<0||a>=1&&i>0?i*4.6:0,c=Math.max(-18,Math.min(18,o*.24+s));n.current.lastX=e.clientX,n.current.lastTime=t,n.current.velocity=i,m(c),b(a*100)},onPointerUp:e=>{n.current.active=!1,e.currentTarget.hasPointerCapture(e.pointerId)&&e.currentTarget.releasePointerCapture(e.pointerId),g(!1),m(0)},onPointerCancel:()=>{n.current.active=!1,g(!1),m(0)}})]})})]})}),(0,i.jsxs)(`section`,{className:`reference-experience`,"aria-label":`Original grass reference video`,children:[(0,i.jsxs)(`div`,{className:`reference-stage-shell`,children:[(0,i.jsxs)(`figure`,{className:`grass-stage reference-stage`,children:[_.kind===`video`?(0,i.jsx)(`video`,{className:`reference-video`,src:_.src,poster:_.poster,autoPlay:!0,loop:!0,muted:!0,playsInline:!0,preload:`auto`,"aria-label":_.label},_.id):(0,i.jsx)(`img`,{className:`reference-image`,src:_.src,alt:_.label},_.id),(0,i.jsx)(`figcaption`,{className:`visually-hidden`,children:`Active real-world reference footage for the generated grass study.`})]}),(0,i.jsx)(`aside`,{className:`reference-media-tray`,"aria-label":`Reference media`,children:v.map(e=>{let t=_.id===e.id;return(0,i.jsxs)(`div`,{className:`reference-map-item`,children:[(0,i.jsx)(`button`,{className:`reference-map-button${t?` is-selected`:``}`,type:`button`,"aria-label":`Show ${e.caption}`,"aria-pressed":t,onClick:()=>u(e.id),children:e.kind===`video`?(0,i.jsx)(`video`,{className:`reference-map`,src:e.src,poster:e.poster,autoPlay:!0,loop:!0,muted:!0,playsInline:!0,preload:`metadata`,"aria-hidden":`true`}):(0,i.jsx)(`img`,{className:`reference-map`,src:e.src,alt:``})}),(0,i.jsx)(`span`,{className:`reference-map-hover-label`,"aria-hidden":`true`,children:e.caption})]},e.id)})})]}),(0,i.jsx)(`p`,{className:`reference-caption`,"aria-live":`polite`,children:_.caption})]})]})}export{k as OrnamentalGrass};