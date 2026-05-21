The build absolutely needs a narrative thread, but it must be the right kind of thread. You are building a study tool for FRCEM candidates, not a visual novel. If the narrative thread becomes a soap opera about Stan’s tragic backstory or a contrived murder mystery about a delayed STEMI, you will destroy the pedagogical core of the application. The player will start gaming the dialogue tree to "see what happens to Stan" instead of rigorously applying NICE guidelines. 

However, arguing for "narrative blankness" (Option E) is a profound missed opportunity. If you wanted a sterile, context-free question bank, you wouldn't have built a Disco Elysium-inspired kernel. Real Emergency Medicine is intensely episodic regarding patients, but it is deeply continuous regarding *you*. The patients blur together, but your relationship with the charge nurse, your standing with the consultant, and the ambient friction of a collapsing NHS department form a relentless, unbroken narrative. 

Therefore, you must implement a hybrid of **Option A (Player-character arc)** and **Option C (Department-level arc)**. The protagonist is the player's clinical competence; the antagonist is the system.

### Pedagogy vs. Entertainment
Adding a narrative thread of professional maturation does not pull the product toward cheap entertainment; it cements its credibility as a high-fidelity simulator. FRCEM candidates are not just memorizing algorithms; they are learning to inhabit the role of a senior decision-maker. 

A narrative thread that tracks the player's transition from an overwhelmed SHO to a trusted Registrar reinforces the psychological reality of the job. When Consultant McGrath’s post-shift memos shift from micromanaging your documentation to asking your opinion on a complex dissection, the player feels the weight of their accrued knowledge. This is not a distraction from study; it is the ultimate reward for studying. It provides the stakes that rote flashcards lack.

### The Shape of the Thread: The Professional Arc
Reject Option B (Recurring-patient continuity) and Option D (Mystery arc). Tying the narrative to specific patients distorts the reality of EM. You treat them, you admit them, and they disappear into the hospital. Forcing them back into the ED to deliver narrative payoffs feels like an episode of *Casualty*, not a shift in a real trauma center. 

Instead, lean entirely into the Player and the Department (A + C). The rota is a compressed year of training. 
*   **Block 1:** The department is functioning, but you are an unknown quantity. Charge Nurse Akin watches you with skepticism. McGrath double-checks your work.
*   **Block 2:** The winter crisis hits. The department breaks down. Referral pathways fail. Akin starts relying on you to clear the corridor. McGrath’s memos become terse, focused purely on throughput and safety.
*   **Block 3:** You are the senior on the floor. The department is a warzone, but you are the veteran. McGrath treats you as a peer. 

This shape costs zero mechanic changes. It requires no complex state machines. It buys immense player retention and thematic weight, turning the keystone shifts into genuine rites of passage.

### Mechanic Surface: Zero New Schema
Do not touch the arc schema. Do not build cross-shift patient state. If you build a system where Williams "remembers" the player in a later shift, you are opening a Pandora's box of combinatorial state tracking that will break your deterministic YAMLs and paralyze your authoring process.

The constraint must be absolute: **The narrative thread must live entirely within the existing meta-systems.** 

The kernel already tracks `rota.completedShifts` and the player's performance band. That is all the state you need. The narrative thread should be delivered exclusively through the "wrapper" of the shift:
1.  **Pre-shift:** A brief text handover from Charge Nurse Akin (e.g., "Bed state is black today. Medical outliers in resus. Don't dawdle.")
2.  **Post-shift:** The existing Consultant Memo from McGrath.

By keeping the narrative in the meta-layer, the shifts themselves remain pristine, isolated clinical encounters. You preserve the single-shift arc system for intra-shift triangulation (like the hen-do anaphylaxis), which is where mechanical complexity actually serves clinical reasoning.

### Recurring NPC Voice
NPC voice is the cheapest, most effective way to carry this thread. Akin and McGrath are your anchors. 

Akin currently exists only in the entry shift. This is a waste of a brilliant character. She should deliver a one-paragraph pre-shift handover before *every* shift. This paragraph sets the thematic weather of the department (Option C) and reflects her evolving view of the player (Option A). 

McGrath already owns the post-shift debrief. Her memos simply need to be authored to reference the player's progression through the rota blocks, not just their performance on the immediate shift. 

More NPC presence is not actively bad as long as it is strictly professional. They are not your friends; they are your colleagues. Their dialogue should be entirely focused on clinical standards, patient flow, and department politics. This maintains the study tool's rigorous tone while providing deep narrative satisfaction.

### The Randomness Trade-off
By rejecting patient-continuity arcs (Option B) and keeping the narrative in the meta-layer (Akin/McGrath), you completely protect the build's capacity for randomness. 

If the narrative thread is simply "the department gets busier and the consultant trusts you more over time," it does not matter if the player sees the `ep_stroke_solo` shift before or after the `ep_paracetamol_solo` shift. The clinical cases can be randomized, reordered, or swapped out for variants in future updates without breaking a single narrative dependency. The pre-shift and post-shift text simply render based on the *number* of shifts completed, not the *content* of those shifts. You get a compelling linear narrative without sacrificing modularity.

### The First Move
Do not over-engineer this. Do not write a new schema. Prove the value of the narrative thread using the surfaces you already have. The smallest viable move is to expand Charge Nurse Akin's role from a single-shift tutorial guide to the permanent voice of the rota's progression.

***

**Verdict (one line):** yes-with-strict-constraints
**Primary shape if yes:** Hybrid A + C (Player-character maturation + Department-level systemic friction)
**Smallest first commit:** Add a pre-shift text handover from Charge Nurse Akin to the start of every shift, conditionally rendering based on `rota.completedShifts`.
**Confidence:** high
