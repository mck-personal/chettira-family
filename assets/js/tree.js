(async function () {
  const $ = (id) => document.getElementById(id);

  // -----------------------------
  // Config
  // -----------------------------
  const BRANCH_COLORS = {
    "Sri Bopaiah": "#1d4ed8",
    "Sri Subbaiah": "#0ea5e9",
    "Sri Chengappa": "#6366f1",
    "ROOT": "#2563eb"
  };

  // Spouse detection in your JSON format
  const SPOUSE_RE = /^(wife|husband)\s*:/i;

  // Default avatar image for everyone (put this file in repo)
  const DEFAULT_AVATAR = "assets/images/people/default.png";

  // Avatar sizing (BIGGER)
  const R_PERSON = 26;  // base person radius
  const R_SPOUSE = 22;  // base spouse radius
  const RING = 4;       // white ring thickness

  // Root/top ancestors slightly larger
  const ROOT_BOOST = 8;      // depth 0 boost
  const TOP_BOOST = 5;       // depth 1 boost (branch ancestors)
  const SPOUSE_BOOST = 2;    // spouse slight boost

  // Hover animation
  const HOVER_DELTA = 4;     // how much avatar grows on hover
  const HOVER_MS = 120;      // hover transition duration (ms)

  // Font sizes
  const NAME_FONT_MAIN = 15; // normal names
  const NAME_FONT_TOP = 16;  // root/top names
  const ROLE_FONT = 12;      // Wife/Husband label font

  // Tree spacing (adjusted for bigger avatars)
  const DX = 36;   // vertical spacing between rows
  const DY = 300;  // horizontal spacing between generations

  // -----------------------------
  // Helpers
  // -----------------------------
  function isSpouseNodeName(name) {
    return SPOUSE_RE.test((name || "").trim());
  }

  function spouseRole(name) {
    const m = (name || "").trim().match(/^(wife|husband)\s*:/i);
    return m ? (m[1].toLowerCase() === "wife" ? "Wife" : "Husband") : "";
  }

  function spousePersonName(name) {
    return (name || "").replace(SPOUSE_RE, "").trim();
  }

  function nodeKids(n) {
    return (n.children || n._children || []);
  }

  function getBranchName(d) {
    if (!d) return "ROOT";
    if (d.depth === 0) return "ROOT";
    let cur = d;
    while (cur.depth > 1) cur = cur.parent;
    return cur?.data?.name || "ROOT";
  }

  function getBranchColor(d) {
    const b = getBranchName(d);
    return BRANCH_COLORS[b] || BRANCH_COLORS["ROOT"];
  }

  function displayLabel(d) {
    const n = d.data?.name || "";
    return isSpouseNodeName(n) ? spousePersonName(n) : n;
  }

  function initialsFor(name) {
    const clean = (name || "").replace(/[()]/g, "").trim();
    if (!clean) return "?";
    const parts = clean.split(/[ /]+/).filter(Boolean);
    const first = parts[0]?.[0] || "?";
    const last = (parts.length > 1 ? parts[parts.length - 1][0] : "") || "";
    return (first + last).toUpperCase();
  }

  function radiusFor(d) {
    const spouse = isSpouseNodeName(d.data?.name || "");
    let r = spouse ? (R_SPOUSE + SPOUSE_BOOST) : R_PERSON;

    if (d.depth === 0) r += ROOT_BOOST;
    else if (d.depth === 1) r += TOP_BOOST;

    return r;
  }

  function photoUrl(d) {
    return d.data?.photo || DEFAULT_AVATAR;
  }

  function isMatch(d, q) {
    if (!q) return false;
    const ql = q.toLowerCase();
    const raw = (d.data?.name || "").toLowerCase();
    const shown = (displayLabel(d) || "").toLowerCase();
    return raw.includes(ql) || shown.includes(ql);
  }

  // -----------------------------
  // Details panel
  // -----------------------------
  function setDetails(d) {
    const panel = $("details");
    if (!panel) return;

    if (!d) {
      panel.innerHTML = `
        <h3>Node Details</h3>
        <p class="meta">Click any node (circle or name) to view details here.</p>
      `;
      return;
    }

    const branch = getBranchName(d);
    const name = d.data?.name || "";
    const notes = d.data?.notes || "";
    const photo = d.data?.photo || "";
    const kids = nodeKids(d);

    // Spouse node
    if (isSpouseNodeName(name)) {
      const role = spouseRole(name);
      const spouseName = spousePersonName(name);
      const partner = d.parent?.data?.name ? d.parent.data.name : "(unknown)";
      const spouseChildren = kids.map(c => c.data?.name).filter(Boolean);

      panel.innerHTML = `
        <h3>${spouseName}</h3>
        <div class="meta">
          <span class="pill">${role}</span>
          <span class="pill">Partner: ${partner}</span>
          <span class="pill">Branch: ${branch.replace("Sri ","")}</span>
          ${photo ? `<span class="pill">Photo</span>` : ``}
        </div>

        ${
          spouseChildren.length
            ? `<strong>Children</strong><ul>${spouseChildren.map(x => `<li>${x}</li>`).join("")}</ul>`
            : `<p class="kicker">Children: (none listed / not recorded)</p>`
        }

        ${notes ? `<hr /><strong>Notes</strong><p>${notes}</p>` : ``}
      `;
      return;
    }

    // Person node: spouse nodes are among children
    const spouseNodes = kids.filter(c => isSpouseNodeName(c.data?.name || ""));
    const spouses = spouseNodes.map(s => spousePersonName(s.data.name));

    // Children list includes:
    // - direct non-spouse children
    // - children under spouse nodes
    const childrenSet = [];
    for (const c of kids) {
      const cname = c.data?.name || "";
      if (isSpouseNodeName(cname)) {
        for (const gc of nodeKids(c)) {
          if (gc.data?.name) childrenSet.push(gc.data.name);
        }
      } else {
        if (cname) childrenSet.push(cname);
      }
    }

    panel.innerHTML = `
      <h3>${name}</h3>
      <div class="meta">
        <span class="pill">Branch: ${branch.replace("Sri ","")}</span>
        ${photo ? `<span class="pill">Photo</span>` : ``}
        ${spouses.length ? `<span class="pill">Spouse</span>` : ``}
      </div>

      ${
        spouses.length
          ? `<strong>Spouse</strong><ul>${spouses.map(s => `<li>${s}</li>`).join("")}</ul>`
          : `<p class="kicker">Spouse: (not recorded here)</p>`
      }

      ${
        childrenSet.length
          ? `<strong>Children</strong><ul>${childrenSet.map(c => `<li>${c}</li>`).join("")}</ul>`
          : `<p class="kicker">Children: (none listed / not recorded)</p>`
      }

      ${notes ? `<hr /><strong>Notes</strong><p>${notes}</p>` : ``}
    `;
  }

  // -----------------------------
  // Collapse/expand helpers
  // -----------------------------
  function collapseAll(node) {
    if (node.children) {
      node._children = node.children;
      node._children.forEach(collapseAll);
      node.children = null;
    }
  }

  function expandAll(node) {
    if (node._children) {
      node.children = node._children;
      node._children = null;
    }
    if (node.children) node.children.forEach(expandAll);
  }

  function collapseToDepth(node, depth) {
    if (!node) return;
    if (depth === 999) { expandAll(node); return; }

    if (node.depth >= depth) {
      collapseAll(node);
      return;
    }
    if (node._children) {
      node.children = node._children;
      node._children = null;
    }
    if (node.children) node.children.forEach(child => collapseToDepth(child, depth));
  }

  function expandToNode(d) {
    let cur = d;
    while (cur) {
      if (cur._children) {
        cur.children = cur._children;
        cur._children = null;
      }
      cur = cur.parent;
    }
  }

  // -----------------------------
  // Load data
  // -----------------------------
  const data = await fetch("assets/data/family-tree.json").then(r => r.json());
  const root = d3.hierarchy(data);

  // -----------------------------
  // SVG setup
  // -----------------------------
  const treeContainer = $("tree");
  const width = () => treeContainer?.clientWidth || 1200;
  const height = () => treeContainer?.clientHeight || 700;

  const tree = d3.tree().nodeSize([DX, DY]);
  const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);

  const svg = d3.select("#tree")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .style("font", "15px Aptos, Segoe UI, system-ui, sans-serif")
    .style("user-select", "none");

  const defs = svg.append("defs");
  const g = svg.append("g");

  // Shadow for avatar ring
  defs.append("filter")
    .attr("id", "avatarShadow")
    .attr("x", "-30%").attr("y", "-30%")
    .attr("width", "160%").attr("height", "160%")
    .append("feDropShadow")
    .attr("dx", 0)
    .attr("dy", 2)
    .attr("stdDeviation", 2.5)
    .attr("flood-color", "#0f172a")
    .attr("flood-opacity", 0.18);

  // Strong selection glow
  defs.append("filter")
    .attr("id", "selectedGlow")
    .attr("x", "-40%").attr("y", "-40%")
    .attr("width", "180%").attr("height", "180%")
    .append("feDropShadow")
    .attr("dx", 0)
    .attr("dy", 0)
    .attr("stdDeviation", 5)
    .attr("flood-color", "#1d4ed8")
    .attr("flood-opacity", 0.55);

  // Zoom/Pan
  const zoomBehavior = d3.zoom()
    .scaleExtent([0.35, 2.8])
    .on("zoom", (event) => g.attr("transform", event.transform));
  svg.call(zoomBehavior);

  // IDs
  let idCounter = 0;
  root.each(d => { d.id = ++idCounter; });

  // Default collapse
  collapseToDepth(root, 2);

  let selectedId = null;
  let currentQuery = "";

  setDetails(null);

  // -----------------------------
  // Clip paths (avatar circular crop)
  // -----------------------------
  function ensureClipPaths(nodes) {
    const clips = defs.selectAll("clipPath.avatar-clip")
      .data(nodes, d => d.id);

    const enter = clips.enter()
      .append("clipPath")
      .attr("class", "avatar-clip")
      .attr("id", d => `clip-${d.id}`);

    enter.append("circle")
      .attr("cx", 0).attr("cy", 0)
      .attr("r", d => radiusFor(d));

    clips.select("circle")
      .attr("r", d => radiusFor(d));

    clips.exit().remove();
  }

  function setClipRadius(d, r) {
    defs.select(`#clip-${d.id} circle`).attr("r", r);
  }

  function setAvatarSize(groupSel, d, r) {
    groupSel.select("circle.avatar-bg").attr("r", r);
    groupSel.select("image.avatar-img")
      .attr("x", -r).attr("y", -r)
      .attr("width", r * 2).attr("height", r * 2);
    groupSel.select("circle.avatar-ring").attr("r", r);

    // keep clipping perfect
    setClipRadius(d, r);

    // update label distance
    groupSel.select("text.node-label")
      .attr("x", d._children ? -(r + 16) : (r + 16));

    // spouse role label distance (if exists)
    groupSel.select("text.role-label")
      .attr("x", d._children ? -(r + 16) : (r + 16));
  }

  function selectNode(d) {
    selectedId = d.id;
    setDetails(d);
  }

  function toggleNode(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else if (d._children) {
      d.children = d._children;
      d._children = null;
    }
  }

  // -----------------------------
  // Render/update
  // -----------------------------
  function update(source) {
    tree(root);

    const nodes = root.descendants();
    const links = root.links();

    ensureClipPaths(nodes);

    // ViewBox bounds
    let left = root, right = root;
    root.eachBefore(n => {
      if (n.x < left.x) left = n;
      if (n.x > right.x) right = n;
    });

    const vbW = Math.max(width(), 1100);
    const vbH = (right.x - left.x) + 260;
    svg.attr("viewBox", [-120, left.x - 130, vbW, vbH]);

    // Links
    const link = g.selectAll("path.link").data(links, d => d.target.id);

    link.enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#93c5fd")
      .attr("stroke-width", 2)
      .attr("d", d => {
        const o = { x: source.x0 ?? 0, y: source.y0 ?? 0 };
        return diagonal({ source: o, target: o });
      })
      .merge(link)
      .transition().duration(250)
      .attr("d", diagonal);

    link.exit().remove();

    // Nodes
    const node = g.selectAll("g.node").data(nodes, d => d.id);

    const nodeEnter = node.enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${source.y0 ?? 0},${source.x0 ?? 0})`);

    // Hover: gently enlarge avatar
    nodeEnter
      .on("mouseenter", function (event, d) {
        const gsel = d3.select(this);
        const r = radiusFor(d);

        gsel.raise();
        gsel.selectAll("circle.avatar-bg, image.avatar-img, circle.avatar-ring")
          .transition().duration(HOVER_MS);

        setAvatarSize(gsel, d, r + HOVER_DELTA);
      })
      .on("mouseleave", function (event, d) {
        const gsel = d3.select(this);
        const r = radiusFor(d);

        gsel.selectAll("circle.avatar-bg, image.avatar-img, circle.avatar-ring")
          .transition().duration(HOVER_MS);

        setAvatarSize(gsel, d, r);
      });

    // Background circle (also handles click: details + toggle)
    nodeEnter.append("circle")
      .attr("class", "avatar-bg")
      .attr("r", d => radiusFor(d))
      .attr("fill", d => isSpouseNodeName(d.data?.name || "") ? "#ffffff" : getBranchColor(d))
      .attr("stroke", d => getBranchColor(d))
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        selectNode(d);
        toggleNode(d);
        update(d);
      });

    // Avatar image (clipped)
    nodeEnter.append("image")
      .attr("class", "avatar-img")
      .attr("href", d => photoUrl(d))
      .attr("x", d => -radiusFor(d))
      .attr("y", d => -radiusFor(d))
      .attr("width", d => radiusFor(d) * 2)
      .attr("height", d => radiusFor(d) * 2)
      .attr("preserveAspectRatio", "xMidYMid slice")
      .attr("clip-path", d => `url(#clip-${d.id})`)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        selectNode(d);
        toggleNode(d);
        update(d);
      })
      .on("error", function () {
        // If image fails to load, remove it (initials will remain if configured)
        d3.select(this).attr("href", null);
      });

    // Initials fallback (shown only if no explicit photo AND default avatar fails)
    nodeEnter.append("text")
      .attr("class", "avatar-initials")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", d => isSpouseNodeName(d.data?.name || "") ? "#0f172a" : "#ffffff")
      .style("font-weight", 900)
      .style("font-size", d => (radiusFor(d) <= 18 ? "11px" : "12px"))
      .text(d => d.data?.photo ? "" : initialsFor(d.data?.name || ""))
      .style("pointer-events", "none");

    // White ring + shadow (selection glow applied later)
    nodeEnter.append("circle")
      .attr("class", "avatar-ring")
      .attr("r", d => radiusFor(d))
      .attr("fill", "none")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", RING)
      .style("filter", "url(#avatarShadow)")
      .style("pointer-events", "none");

    // Name label
    nodeEnter.append("text")
      .attr("class", "node-label")
      .attr("dy", "0.32em")
      .attr("x", d => (d._children ? -(radiusFor(d) + 16) : (radiusFor(d) + 16)))
      .attr("text-anchor", d => (d._children ? "end" : "start"))
      .attr("fill", d => isSpouseNodeName(d.data?.name || "") ? "#334155" : "#0f172a")
      .style("cursor", "pointer")
      .style("font-size", d => (d.depth <= 1 ? `${NAME_FONT_TOP}px` : `${NAME_FONT_MAIN}px`))
      .style("font-weight", d => (d.depth <= 1 ? 800 : 650))
      .text(d => displayLabel(d))
      .on("click", (event, d) => {
        event.stopPropagation();
        selectNode(d);
        update(d);
      });

    // Spouse role label (Wife/Husband)
    nodeEnter.filter(d => isSpouseNodeName(d.data?.name || ""))
      .append("text")
      .attr("class", "role-label")
      .attr("dy", "1.6em")
      .attr("x", d => (d._children ? -(radiusFor(d) + 16) : (radiusFor(d) + 16)))
      .attr("text-anchor", d => (d._children ? "end" : "start"))
      .attr("fill", "#64748b")
      .style("font-weight", 800)
      .style("font-size", `${ROLE_FONT}px`)
      .text(d => spouseRole(d.data.name));

    nodeEnter.append("title").text(d => d.data?.name || "");

    const nodeMerge = nodeEnter.merge(node);

    // Apply match/selected classes (for potential CSS)
    nodeMerge
      .classed("selected", d => d.id === selectedId)
      .classed("match", d => isMatch(d, currentQuery));

    // Strong selection glow + thicker ring on selected
    nodeMerge.select("circle.avatar-ring")
      .style("filter", d => (d.id === selectedId) ? "url(#selectedGlow)" : "url(#avatarShadow)")
      .attr("stroke-width", d => (d.id === selectedId) ? (RING + 2) : RING);

    nodeMerge.transition().duration(250)
      .attr("transform", d => `translate(${d.y},${d.x})`);

    node.exit().remove();

    nodes.forEach(d => { d.x0 = d.x; d.y0 = d.y; });
  }

  update(root);

  // -----------------------------
  // Search
  // -----------------------------
  function findMatches(query) {
    const q = (query || "").trim().toLowerCase();
    if (!q) return [];
    return root.descendants().filter(d => isMatch(d, q));
  }

  function centerOnNode(d) {
    const w = width();
    const h = height();
    const scale = 1.0;
    const transform = d3.zoomIdentity
      .translate(w / 2 - d.y * scale, h / 2 - d.x * scale)
      .scale(scale);
    svg.transition().duration(350).call(zoomBehavior.transform, transform);
  }

  function runSearch() {
    currentQuery = ($("searchInput")?.value || "").trim().toLowerCase();
    if (!currentQuery) {
      update(root);
      return;
    }

    const matches = findMatches(currentQuery);
    if (!matches.length) {
      setDetails(null);
      update(root);
      return;
    }

    const first = matches[0];
    expandToNode(first);

    selectedId = first.id;
    setDetails(first);

    update(first);
    centerOnNode(first);
  }

  // -----------------------------
  // UI wiring (expects these IDs in family-tree.html)
  // searchInput, searchBtn, clearBtn, depthSelect, collapseBtn, expandBtn
  // tree, details
  // -----------------------------
  $("searchBtn")?.addEventListener("click", (e) => { e.preventDefault(); runSearch(); });
  $("searchInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); runSearch(); }
  });

  $("clearBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    if ($("searchInput")) $("searchInput").value = "";
    currentQuery = "";
    selectedId = null;
    setDetails(null);
    const depth = parseInt($("depthSelect")?.value || "2", 10);
    collapseToDepth(root, depth);
    update(root);
  });

  $("collapseBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    const depth = parseInt($("depthSelect")?.value || "2", 10);
    collapseToDepth(root, depth);
    update(root);
  });

  $("expandBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    expandAll(root);
    update(root);
  });

  $("depthSelect")?.addEventListener("change", () => {
    const depth = parseInt($("depthSelect")?.value || "2", 10);
    collapseToDepth(root, depth);
    update(root);
  });

  // Click background clears selection
  svg.on("click", () => {
    selectedId = null;
    setDetails(null);
    update(root);
  });

})();