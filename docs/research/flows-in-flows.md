# Flows in flows: research notes (2026-11-17)

Research behind [ADR 0025](../adr/0025-flows-in-flows.md). The maintainer, 2026-11-16:

> Right now the demo that we have is there's a lot going on in the Flow itself. [...] we need to come up with a concept of
> some component hierarchical nature to flows where you can create a flow that can become a part of a flow. It can become
> part of more flows, and so you can kind of build and stack onto each other. And so if you update one bronze thing, it
> just kind of flows throughout the rest of it, and works seamlessly. [...] I want you to go out, look at the code base
> that we have now, look at ontologies, do some deep research on ontologies, do some deep research on Alteryx, as well as
> Palantir and kind of some other data engineering platforms that are out there, especially focusing on the visual aspect
> of this, and the data quality and the hashing of everything, and how we can use what we have now, edit it so that we can
> bring in this type of component.

**How it was made.** Seven strands were researched in parallel, in two passes, and synthesised into the report below:
Alteryx; Palantir Foundry; nested units in other visual tools and node-graph editors; composition and hashing in
code-first tools and build systems; ontologies and data contracts; quality roll-ups and data exploration; brand voice
and naming.

- **The first pass** could open no vendor page (the session's network allowed GitHub alone) and ran short of web
  searches, so it rested on documentation sources kept on GitHub, search summaries and recall, each marked.
- **The second pass,** with twenty documentation sites allowed, read the vendors' own pages: about 130 of Alteryx's help
  pages, 376 of Foundry's, and the documentation of KNIME, Dataiku, Unreal, Houdini, Simulink, Figma, Microsoft, the W3C
  texts, Statuspage, Tableau Prep and MotherDuck. It corrected the first pass where the pages said otherwise. Composition
  and hashing was read from the projects' own repositories in the first pass and was not run again.
- **What stayed out of reach:** the Alteryx and Palantir community sites, Observable, Britannica and the Corning Museum
  of Glass (each answers automated reading with a challenge), and the research literature on nested diagrams. Findings
  that rest on them are search summaries and are said to be where they are used.
- **No product was run.** Every description of how something looks comes from documentation, some of it from
  screenshots of single examples.

The report's last section says where each recommendation rests on weaker evidence. What was decided from it is ADR
0025; where the report recommends something the ADR does not take (keying a reader by the content of what it reads, a
flow run on its own and read by another), the ADR's "Not built, and why" says so.

## Nest flows by hash, not by path

No platform surveyed delivers the whole of what smaltfl wants from a flow used inside another flow, but every part of it
exists somewhere, verified in a vendor's own documentation or source code. **Alteryx's macro is an opaque tool with no
status of its own**, identified by a file path or, since October 2026, by an asset reference whose version defaults to
"Always Use Latest Version", with no notice to the workflows that use it; **Palantir Foundry's subgraph**, generally
available since 27 October 2026, is one node with named ports that opens into its own editor, yet it lives inside one
pipeline, carries no badge and has no documented version to pin. The best update mechanics sit elsewhere (KNIME's three
things a link can follow, Apache NiFi's five drift states, Figma's publish, review and accept), real identity sits only
in code-first tools and build systems (a Merkle hash over a unit and its children, with a separate interface hash in dbt
and Avro), and the roll-up that survives scrutiny is worst-of with counts (Dagster, Airflow 3, Dataiku, the Bitol OORS
draft), never an average. Two absences matter most: neither Alteryx nor Foundry documents a content hash of a component,
a dataset or a run, and **no product read has a state for data that was computed, kept and held for a decision**, which
smaltfl already has. smaltfl should therefore take a structure and not a product: one definition, referenced by name and
resolved to a pinned, content-hashed copy when the plan is made; declared ports with stable ids; updates offered with a
diff and a restatement preview; a badge derived by precedence of outcomes and never written by the component's author; a
node that is entered, not expanded, and shows the placement's own data; a card per column for exploring outputs; and
plain words in the interface, with the glass metaphor kept to the brand layer. These conclusions rest on vendor
documentation and source code read directly on 16 and 17 November 2026 and gathered in the research notes this report
synthesises; community complaints about Alteryx and Foundry, the research literature on nested diagrams, several brand
anecdotes and the dictionary definitions behind candidate names were seen only as search summaries, and are flagged
where they are used.

### Placing a flow means three things, and the newest designs let each placement choose

Across the twenty-odd tools whose documentation or source was read directly, putting a reusable unit on a canvas means
one of three things. It is **a visual group with no identity of its own** (Alteryx's Tool Container, Foundry's colour
group, KNIME's metanode, Dataiku's zone, Tableau Prep's group); **one live definition that every placement follows**
(Node-RED's subflow, Simulink's library link, an Azure Data Factory flowlet); or **a published snapshot that each
placement tracks, with an explicit step before a change applies** (Apache NiFi's versioned flow, KNIME's linked
component, Figma's library). Flyte names the underlying choice most plainly: "think of launch plans as 'pass by pointer'
and subworkflows as 'pass by value.'" ([Flyte:
Subworkflows](https://github.com/flyteorg/flyte/blob/master/docs/user_guide/advanced_composition/subworkflows.md)). The
choice decides when a change arrives, whether a past run can be reproduced and whether the unit has a version at all. It
is the first decision smaltfl faces, and it is where Alteryx and Foundry are weakest.

**Alteryx's only nesting unit is the macro**: "a workflow or group of tools combined into a single tool that you can
insert into another workflow", saved as its own file, with ports declared inside the child by Macro Input and Macro
Output tools and parameters by interface tools ([Alteryx help:
Macros](https://help.alteryx.com/designer/current/en/apps-and-macros/macros.html)). Tool Containers and Control
Containers group or gate tools in place and are not reusable, and the browser-based Designer Cloud canvas has no macro
tool at all in its official tool list ([Alteryx help: Designer Cloud
Tools](https://help.alteryx.com/designer-cloud/en/standard-mode-tools.html)). For most of its life a macro reference was
a file path, which gave two opposite behaviours: a macro in a shared folder changes under every workflow at its next
open or run ("When changes are saved to a macro, it is automatically updated"), and a macro packaged with a workflow is
a frozen copy. Designer 2026.3 (14 October 2026) added the product's first recorded binding. A placement now stores an
Alteryx One asset reference with either a numbered version or **"Always Use Latest Version", which is the default**. The
latest version is picked "when workflow execution first reaches the macro", and the option "does not limit selection to
published versions" ([Alteryx help: Use Alteryx One
Macros](https://help.alteryx.com/designer/current/en/apps-and-macros/macros/use-alteryx-one-macros-in-designer-workflows.html)).
The owner gets a "Used In" tab that lists each consuming workflow with the macro version it uses, and each job records
which version ran ([Alteryx help: Asset
Details](https://help.alteryx.com/platform/en/library-for-assets/manage-assets/asset-details.html); [Alteryx help: Job
Details](https://help.alteryx.com/platform/en/job-history-page/job-details.html)). The consumer gets nothing: none of
the platform's documented notification events concerns a dependency, and the help's only advice reads "Review the
workflow after the macro owner publishes an update" ([Alteryx help: Notification
Settings](https://help.alteryx.com/platform/en/profile/preferences-page/notification-settings.html)). The newest canvas
and the newest reuse features do not yet meet: Modern View, the default for new installs since Designer 2026.4 (12
November 2026), can use macros but cannot author them or insert an Alteryx One macro ([Alteryx help: Modern View feature
availability](https://help.alteryx.com/designer/current/en/get-started/designer-user-interface/designer-modern-view/modern-view---classic-view-feature-availability.html);
[Designer 2026.4 release
notes](https://help.alteryx.com/release-notes/en/designer-release-notes/designer-2026-4-release-notes.html)).

**Foundry's closest unit is the Pipeline Builder subgraph**, generally available "across all enrollments starting
October 27" 2026, although the product's transforms overview page still labels it beta ([Foundry announcements, October
2026](https://www.palantir.com/docs/foundry/announcements/2026-10)). It separates a definition from its instances,
declares the columns each input requires and the type of each parameter, binds inputs at every instance by pointing at
nodes on the graph, and promises: "Update a subgraph once to affect all its instances" ([Foundry:
Subgraphs](https://www.palantir.com/docs/foundry/pipeline-builder/subgraphs)). Every documented step happens inside one
pipeline. The page does not say a subgraph can be used from another pipeline, versioned, pinned or nested, and
Palantir's own comparison table gives Pipeline Builder's reusability as "Copy and paste complete pipelines or pipeline
stages" ([Foundry: Pipeline Builder and Code
Repositories](https://www.palantir.com/docs/foundry/building-pipelines/considerations-pb-cr)). Reuse across pipelines
takes other routes, each with a different rule for consumers. A dataset read from another project is a reference with no
version, which by the notes' inference changes under its readers at their next build. Functions are versioned and either
pinned or given a version range that upgrades automatically to backward-compatible releases, and Workflow Lineage lists
every consumer with its current and target version and one of four verdicts before a bulk upgrade ([Foundry: Version
range dependencies](https://www.palantir.com/docs/foundry/functions/version-range-dependencies-for-functions); [Foundry:
Workflow Lineage](https://www.palantir.com/docs/foundry/workflow-lineage/refactor-and-understand-workflows)).
Marketplace products are installed copies that remember a semantic version, upgrade by hand unless a beta setting is
switched on, and can be downgraded or recalled ([Foundry: Marketplace
upgrades](https://www.palantir.com/docs/foundry/marketplace/upgrades)).

| Tool and unit | A placement is | How a change to the definition arrives | What the closed node says | Source |
|---|---|---|---|---|
| Alteryx Designer macro, classic | A tool that refers to the macro's file by path | At the next open or run, unversioned; never, if the workflow was packaged with a copy | Nothing of its own; inner errors surface as message text | [Macros](https://help.alteryx.com/designer/current/en/apps-and-macros/macros.html) |
| Alteryx One macro (2026.3) | An asset reference with a numbered version or "Always Use Latest Version" | Latest: resolved at run time, with no notice. Pinned: when someone chooses | Nothing; the job record names the version that ran | [Alteryx One macros](https://help.alteryx.com/designer/current/en/apps-and-macros/macros/use-alteryx-one-macros-in-designer-workflows.html) |
| Foundry Pipeline Builder subgraph | An instance of a definition in the same pipeline, inputs mapped per instance | At once, to every instance; no version to pin | Named ports and no status (read from the page's screenshots) | [Subgraphs](https://www.palantir.com/docs/foundry/pipeline-builder/subgraphs) |
| Foundry Marketplace product | An installed copy that remembers its product version | On upgrade, manual by default; downgrade and recall exist | A product group shows "Passing" for installability, not for data (screenshot) | [Marketplace upgrades](https://www.palantir.com/docs/foundry/marketplace/upgrades) |
| KNIME linked component | A read-only linked instance | Offered when the workflow opens (policy Never, Always or Prompt); a Hub link follows a specific version, the latest version or the working area | A traffic light; failed when anything inside failed | [KNIME Components Guide](https://docs.knime.com/ap/latest/analytics_platform_components_guide/) |
| Apache NiFi versioned flow | An imported snapshot of one version | Never automatic; the node reads "Stale" until a person changes the version | Counts of inner components by state, bulletins, version state | [NiFi User Guide](https://github.com/apache/nifi/blob/main/nifi-docs/src/main/asciidoc/user-guide.adoc) |
| Simulink library link | A reference; the contents are not saved in the model | At the next load, update or run, with no prompt | A link badge with four looks | [Simulink: Linked Blocks](https://www.mathworks.com/help/simulink/ug/creating-and-working-with-linked-blocks.html) |
| Azure Data Factory flowlet | A reference; the caller maps its columns onto the flowlet's inputs | By reference; no version or prompt is documented | Nothing documented | [Flowlets](https://learn.microsoft.com/en-us/azure/data-factory/concepts-data-flow-flowlet) |
| Tableau Prep inserted flow | A copy of the steps, with parameters frozen to their current values | Never: no link back to the source flow is described | Nothing; it is no longer a unit | [Tableau Prep: reuse steps](https://help.tableau.com/current/prep/en-us/prep_copy_reuse_steps.htm) |
| dbt package; dbt project dependency | Package: source copied in and pinned by a lock file. Project: a reference to a public model | Package: on `dbt deps --upgrade`. Project: follows the producer's production state | Not a canvas node | [dbt packages](https://github.com/dbt-labs/docs.getdbt.com/blob/current/website/docs/docs/build/packages.md); [project dependencies](https://github.com/dbt-labs/docs.getdbt.com/blob/current/website/docs/docs/mesh/govern/project-dependencies.md) |

The table shows the convergence that matters: the newest designs let **each placement choose what it follows**. KNIME
names three targets (a specific version, the latest version, or the unversioned "working area"), Alteryx One two,
Foundry's functions a pin or a compatible range, and Foundry's Quiver a version per use or an auto-update toggle ([KNIME
Components Guide](https://docs.knime.com/ap/latest/analytics_platform_components_guide/); [Foundry: Quiver visual
functions](https://www.palantir.com/docs/foundry/quiver/visual-functions-create)). What separates the designs is the
step between "changed" and "applied". Figma has the fullest: the publisher writes a description and sees the list of
what was added, modified or removed, every file that uses the library shows a badge, and a person there compares side by
side or as an overlay and accepts per asset, per instance or all at once ([Figma: Publish a
library](https://help.figma.com/hc/en-us/articles/360025508373-Publish-a-library); [Figma: Review and accept library
updates](https://help.figma.com/hc/en-us/articles/360039234193-Review-and-accept-library-updates)). NiFi has the
clearest vocabulary for drift, five states shown on the node: "Up to date", "Locally modified", "Stale", "Locally
modified and stale" and "Sync failure" ([NiFi User
Guide](https://github.com/apache/nifi/blob/main/nifi-docs/src/main/asciidoc/user-guide.adoc)). Alteryx One and Simulink
sit at the other end, where a change arrives at the next run or load without a prompt.

Interfaces are declared the same way almost everywhere: named inputs and outputs that belong to the unit, bound at each
use. Foundry's subgraph input "defines the columns the subgraph requires" and each instance maps them; a Data Factory
flowlet's caller "maps columns from a stream into the columns you have defined from the input"; KNIME adds ports on the
node; dbt marks which models are `public` and so part of a project's interface
([Flowlets](https://learn.microsoft.com/en-us/azure/data-factory/concepts-data-flow-flowlet); [dbt: Model
access](https://github.com/dbt-labs/docs.getdbt.com/blob/current/website/docs/docs/mesh/govern/model-access.md)). A unit
placed twice needs a path for each placement (Kedro's namespace prefix, Airflow's group id, ComfyUI's execution id
"1:2:3"), and per-instance values need one owner: Node-RED gives a template default, an instance override and a revert
button, and ComfyUI's design notes record the "Risk of host instances stomping one another through shared interior
values" that led it to make the host instance the owner ([Node-RED
0.20](https://github.com/node-red/node-red.github.io/blob/master/_posts/2019-03-12-version-0-20-released.md); [ComfyUI
frontend, ADR
0009](https://github.com/Comfy-Org/ComfyUI_frontend/blob/main/docs/adr/SUBGRAPH-PROMOTION-0009-represent-promoted-widgets-as-linked-inputs/system-comparison.md)).
Most tools with a shared definition also have a where-used list of some kind, from KNIME's "Related workflows" to
Alteryx's Used In and the usage count beside each Foundry subgraph.

Each model has a documented failure cluster, and choosing a model is choosing which one to manage. Live links change
silently: Alteryx's Trifacta-heritage help warns of "hidden breakages", where a step that relied on particular values
still runs "but the generated results are incorrect" ([Alteryx help: Fix Dependency
Issues](https://help.alteryx.com/trifacta-classic/en/common-tasks/project-management-tasks/fix-dependency-issues.html)).
Copies never receive fixes: Epic says of a copied collapsed graph that "any bug fixes would have to be applied to each
copy" ([Unreal Engine: Nodes](https://dev.epicgames.com/documentation/en-us/unreal-engine/nodes-in-unreal-engine)).
Snapshots drift and block one another: NiFi will not commit a parent's changes while a child has its own. Editing a
placed instance by suspending its link is the pattern both MathWorks and NiFi document failing in hierarchies ("you can
accidentally disable all links without being aware of it"), and MathWorks is withdrawing undeclared per-instance
overrides in favour of declared ones ([Simulink: Disable or Break
Links](https://www.mathworks.com/help/simulink/ug/disable-links-to-library-blocks.html)). An interface change is where a
live link hurts most: Houdini puts a breaking change in a new type name because a changed interface "would break channel
references in previous scene files", and KNIME, NiFi, Node-RED and Dataiku document nothing about it ([Houdini: versions
and namespaces](https://www.sidefx.com/docs/houdini/assets/namespaces.html)). The familiar complaints about Alteryx
macros (no step-into debugging, broken paths, drift between packaged copies and shared folders) come from community
threads that could be read only as search extracts. The vendor's own pages corroborate two of them, calling the old
missing-macro repair "a painful process" and introducing Used In because "You couldn't easily tell which workflows
depended on a shared macro" ([Alteryx help: Update Missing
Macros](https://help.alteryx.com/designer/current/en/apps-and-macros/macros/update-missing-macros.html); [Alteryx One
release notes](https://help.alteryx.com/release-notes/en/alteryx-one-release-notes.html)).

### Alteryx and Foundry leave the node mute, and the best designs open the placement, not the definition

On the parent canvas the verified designs range from an anonymous icon to a small dashboard. A placed Alteryx macro is
drawn like any other tool: an icon with lettered anchors, a "+" marker only if the user has switched on "Display Macro
Indicator on Tools", and no dimming when its outputs are disabled ("macros don't appear disabled in the canvas")
([Alteryx help: User Settings](https://help.alteryx.com/designer/current/en/get-started/user-settings.html); [Alteryx
help: Workflow Configuration](https://help.alteryx.com/designer/current/en/workflows/workflow-configuration.html)). A
Foundry subgraph instance, as the documentation's screenshots show it, is one node with a row for each named input on
its left edge and each named output on its right, so that a downstream join can take one output; it has no status mark,
and a collapsed colour group shows only a count such as "14 contained nodes" ([Foundry:
Subgraphs](https://www.palantir.com/docs/foundry/pipeline-builder/subgraphs); [Foundry: Color
groups](https://www.palantir.com/docs/foundry/pipeline-builder/management-color-groups)). NiFi's process group is the
opposite: a card with counts of inner components running, stopped, invalid and disabled, five minutes of throughput, a
bulletin indicator and the version state ([NiFi User
Guide](https://github.com/apache/nifi/blob/main/nifi-docs/src/main/asciidoc/user-guide.adoc)). Between them, Simulink
draws the kind of unit into the block's corners and the state of its library link into a badge with four looks, KNIME
marks a linked instance with a corner arrow and gives a metanode a coloured dot per output port, and Houdini lets an
error badge be drawn large behind the node so that it is seen when zoomed out ([Simulink: Types of
components](https://www.mathworks.com/help/simulink/ug/types-of-model-components.html); [KNIME Components
Guide](https://docs.knime.com/ap/latest/analytics_platform_components_guide/); [Houdini:
Badges](https://www.sidefx.com/docs/houdini/network/badges.html)). Simulink can also draw a scaled picture of the inside
on the block itself, and Unreal shows one when the pointer rests on a collapsed node ([Simulink: Content
preview](https://www.mathworks.com/help/simulink/ug/preview-content-of-hierarchical-items.html); [Unreal Engine:
Collapsing graphs](https://dev.epicgames.com/documentation/en-us/unreal-engine/collapsing-graphs-in-unreal-engine)).
**No verified tool puts link state and run state into one mark.** NiFi's card comes closest, with a version-state icon
beside counts of what is running, and none shows on one node both that a newer definition exists and how a batch run
went.

Navigation has converged on double-click to enter, a breadcrumb or path to leave, browser-style history and a tree or
minimap for orientation. The split that matters for smaltfl is between entering a unit, which replaces the canvas (NiFi,
Node-RED, ComfyUI, KNIME, Unreal, Houdini, Simulink, Foundry's subgraph editor), and expanding it in place (TensorBoard,
Kedro-Viz, Dataiku's zones, Power Query's diagram view). Every tool that expands in place is a viewer or lays the graph
out itself; that is the notes' reading across the tools, not a vendor's statement. Deep nesting stays recoverable where
each level has an address and remembers its view: ComfyUI keeps "the navigation stack, route hash, and per-graph
viewport in sync", and NiFi gives any inner component a hyperlink ([ComfyUI frontend
record](https://github.com/Comfy-Org/ComfyUI_frontend/blob/main/docs/architecture/domains/records/subgraphs.domain.json);
[NiFi User Guide](https://github.com/apache/nifi/blob/main/nifi-docs/src/main/asciidoc/user-guide.adoc)). Alteryx shows
what to avoid at the level of the gesture: a double-click opens the definition on a macro and the data on a Browse tool
([Alteryx help: Browse Tool](https://help.alteryx.com/designer/current/en/tools/in-out-tools/browse-tool.html)).

The sharpest lesson is about what opens. In Alteryx, "Open Macro" goes to the definition, a file or a version fetched
from the cloud, and not to this placement in this run. The documented debugging route builds a duplicate with the
answers applied that "has not been run yet" and lacks the original's Browse tools, and one community answer, seen only
as a search extract, says the opened macro shows no data from the last execution ([Alteryx help: Debug
Workflow](https://help.alteryx.com/designer/current/en/apps-and-macros/debug-workflow.html); [Alteryx
Community](https://community.alteryx.com/t5/Alteryx-Designer-Desktop-Discussions/How-to-examine-data-flows-within-a-macro/td-p/722035)).
The parent sees data only at the macro's anchors. Data Factory's flowlet has the same hole on the vendor's own page:
"the preview data is only available at the output of the flowlet", and its author types test rows into a grid
([Flowlets](https://learn.microsoft.com/en-us/azure/data-factory/concepts-data-flow-flowlet)). The tools that close the
hole treat data as belonging to a placement. Simulink says "you must debug and analyze each instance individually";
Unreal offers a dropdown to "select which instance to debug"; KNIME's opened component, by the notes' reading, shows the
node states and tables of that one use; Foundry's subgraph instance, in its screenshots, opens on its bindings, with a
selector for previewing each output, before it offers "Edit definition" ([Simulink: Subsystem
references](https://www.mathworks.com/help/simulink/ug/create-and-use-referenced-subsystems-in-models-using-subsystem-reference.html);
[Unreal Engine: Blueprint
Debugger](https://dev.epicgames.com/documentation/en-us/unreal-engine/blueprint-debugger-in-unreal-engine)).
**Transparency has three separate parts: seeing the graph, seeing this placement's data and seeing this placement's
status.**

Getting from a failed parent to the failing inner step is manual in Alteryx: read the message, select the macro, open
it, find the inner tool by its number, and repeat at each level (the form of the inner tool's number in a message is
known from one community log). Severity is set where a message is written, since the Message tool's priority decides
whether it surfaces only in its own workflow, one macro level up, or "regardless of how many levels of macros it is
contained in" ([Alteryx help: Message
Tool](https://help.alteryx.com/designer/current/en/tools/developer/message-tool.html)). Two designs do better. KNIME's
Workflow monitor lists errors and warnings beside the canvas and, for a node inside a component, "will automatically
navigate to the level where the node that is causing the issue is present" ([KNIME User
Guide](https://docs.knime.com/ap/latest/analytics_platform_user_guide/)). ComfyUI lifts a validation error on an inner
input to the matching input of the outermost node that exposes it, and keeps where it came from ([ComfyUI frontend
source](https://github.com/Comfy-Org/ComfyUI_frontend/blob/main/src/core/graph/subgraph/liftNodeErrorsToBoundary.ts)). A
third question is who decides what the parent says. NiFi, KNIME, Dataiku and Airflow derive it from what is inside.
Node-RED, Blender, Houdini and Alteryx let the unit's author choose what climbs out, and in Houdini only the inner nodes
an author lists as "Message Nodes" report on the asset ([Houdini: Type
properties](https://www.sidefx.com/docs/houdini/ref/windows/optype.html)). For a quality gate the authored kind is a
risk, because nesting can then soften a warning that nobody listed.

Two constraints complete the picture. Treating a group as one node creates cycles that do not exist between steps:
Airflow has deprecated task groups that depend on each other in a loop and plans to fail parsing for them from version
3.5, because acting on a group as a whole needs "an unambiguous order between groups" ([Airflow:
Dags](https://github.com/apache/airflow/blob/main/airflow-core/docs/core-concepts/dags.rst)). And **there is nothing to
borrow for phones**. NiFi states that its interface "is designed as a desktop experience and is not currently supported
in mobile browsers"; Foundry's pages describe hover, right-click, double-click and keyboard shortcuts; no documentation
read for KNIME, Dataiku, Unreal, Houdini, Simulink or Figma covers editing a graph by touch. The research on whether
nesting helps readers was reached only through search summaries, and the experiments found, on business process models
and not on data pipelines, disagree with each other, one of them reporting that flattened models were understood best
([Turetken et al., search summary](https://aisel.aisnet.org/bise/vol62/iss2/4)). This report draws no conclusion from
it.

### Worst-of with counts wins the roll-up, averages bury the failure, and nobody holds data

Products aggregate check results in three ways, and the choice changes what a rolled-up badge means. Orchestrators and
catalogues roll up to a small categorical status by a worst-of rule; governance services compute a score from 0 to 100
and average it up a hierarchy; Foundry computes no score and summarises a group by counts and clusters.

| Product | Rule for the parent | What the parent keeps or loses | Source |
|---|---|---|---|
| Dagster+ asset health | "the most elevated status" among materialisation, freshness and checks | Keeps the worst; a popover gives fractions of checks and partitions | [Dagster: Asset health](https://github.com/dagster-io/dagster/blob/master/docs/docs/guides/observe/asset-health-status.md) |
| Airflow 3 grid | The first state present in a fixed priority list, plus a count of children per state | Keeps the worst and how many | [Airflow grid service](https://github.com/apache/airflow/blob/main/airflow-core/src/airflow/api_fastapi/core_api/services/ui/grid.py) |
| Dataiku data quality | The worst outcome at rule, dataset, project and instance level, and per day | Keeps the worst; "Empty" and "Not Computed" are outcomes of their own; nothing is shown on a flow zone | [Dataiku: Data Quality Rules](https://doc.dataiku.com/dss/latest/metrics-check-data-quality/data-quality-rules.html) |
| Bitol OORS (draft v0.8.1) | Precedence: error, fail, warn, pass, skip, unknown | Keeps "could not be evaluated" apart from "failed" | [OORS: fundamentals](https://github.com/bitol-io/open-observability-results-standard/blob/main/docs/fundamentals.md) |
| Foundry Data Health | No score: counts of checks by severity and clusters of related failures (in check groups, a feature now in sunset) | Keeps which checks failed and what they share | [Foundry: Check groups](https://www.palantir.com/docs/foundry/monitoring-views/check-groups) |
| Microsoft Purview | Unweighted averages from rule to column, asset, data product and governance domain | Loses which child failed and how many rows stand behind it | [Purview: data quality scores](https://learn.microsoft.com/en-us/purview/unified-catalog-data-quality-scores) |
| Atlassian Statuspage | A collapsed group's day bar is an average of its children; the page banner follows an all-versus-any ladder | One child down among ten reads as a mild day; the count is in a hover | [Statuspage: historical uptime](https://support.atlassian.com/statuspage/docs/display-historical-uptime-of-components) |

Worst-of is conservative and can be explained in one sentence. Its weakness, that one failed child looks like fifty, has
two verified repairs. Airflow 3 returns for each group both the aggregate state and a count of children per state, and
draws a collapsed group as two stacked cards: the worst state in front and the next most important state present behind
it ([Airflow UI
source](https://github.com/apache/airflow/blob/main/airflow-core/src/airflow/ui/src/layouts/Details/Grid/GridTI.tsx)).
Dagster writes fractions ("‹n›/‹total› checks failed") that link to the list already filtered, and its asset graph
collapses a group "into a single node showing rolled-up status counts for everything inside, including any nested
groups" ([Dagster UI
source](https://github.com/dagster-io/dagster/blob/master/js_modules/ui-core/src/assets/AssetHealthSummary.tsx);
[Dagster:
Groups](https://github.com/dagster-io/dagster/blob/master/docs/docs/guides/build/assets/metadata-and-tags/groups.md)).
Dataiku publishes the fullest definition for data quality: "The current status of the project is the worst current
status of its monitored datasets", repeated one level up and applied over time ("the worst daily status of a dataset is
the worst outcome of all rule computations that happened throughout the selected day") ([Dataiku: Data Quality
Rules](https://doc.dataiku.com/dss/latest/metrics-check-data-quality/data-quality-rules.html)). It stops at levels of
ownership, though, and its flow zones carry no status. On a graph, the one documented quality roll-up is in a viewer,
Foundry's Data Lineage, where "If the nodes are grouped, the color of the group would indicate the most severe health
check status of the group"; that group belongs to a saved view and not to the pipeline, and no authoring tool read puts
a quality status on a reusable unit of the flow ([Foundry: Node
coloring](https://www.palantir.com/docs/foundry/data-lineage/node-coloring)). The OORS draft, marked "NOT READY FOR
PRODUCTION", is the first standard to write the rule as a precedence, and it insists that "a failure is a known-bad
verdict, an `error` is the absence of a verdict and must not be counted as a failure" ([OORS:
results](https://github.com/bitol-io/open-observability-results-standard/blob/main/docs/results.md)).

Averages lose exactly what a gate needs. Purview documents the whole chain ("The data quality score for a data product
is the arithmetic average of the data quality scores of the data assets associated with that data product"), in which
every tier weights its children equally whatever their size and a failed pass-or-fail rule is diluted by its neighbours.
Its own worked example scores 93 on a uniqueness rule for 10,000 rows with 3,000 nulls and 500 duplicates, because nulls
leave the denominator ([Purview: data quality
scores](https://learn.microsoft.com/en-us/purview/unified-catalog-data-quality-scores)). The product itself is being
retired into Microsoft Fabric, "in maintenance mode through November 12, 2027" ([Purview: data
quality](https://learn.microsoft.com/en-us/purview/unified-catalog-data-quality)). The published objections to composite
scores (equal weighting masks critical failures, weights are arbitrary, correlated checks count twice, denominators
shift) come from vendor and practitioner writing, not from controlled studies. The academic base is Pipino, Lee and
Wang's 2002 paper, which offers the minimum as the conservative alternative to a weighted average ([Pipino et
al.](https://doi.org/10.1145/505248.506010)). No study comparing how people read worst-of badges and composite scores
was found.

A badge has to keep apart several states that products routinely merge. "No evidence" is treated four ways: Dagster
ranks Unknown below Healthy, dbt marks a model with no tests as Caution, DataHub leaves tables with no assertion runs
out of its list, and Soda's API returns pass for a dataset with no checks (the Soda finding was read in the first pass
only and not re-checked) ([dbt: Data health
signals](https://github.com/dbt-labs/docs.getdbt.com/blob/current/website/docs/docs/explore/data-health-signals.md);
[DataHub: Data Health
Dashboard](https://github.com/datahub-project/datahub/blob/master/docs/managed-datahub/observe/data-health-dashboard.md)).
Foundry's Workflow Lineage keeps three keys apart in its legend: "All monitors healthy", "No monitors configured" and
"Not applicable" ([Foundry: Monitoring views](https://www.palantir.com/docs/foundry/monitoring-views/overview)). Foundry
also separates a failure in a dataset's own job from a job that never ran because something upstream failed (the dataset
"will register as having a canceled build"), and draws a snoozed check as an overlay with who snoozed it, when and why,
not as a status of its own ([Foundry: Types of
checks](https://www.palantir.com/docs/foundry/health-checks/check-types)).

Which failures stop work is a separate axis from how they roll up. dbt's tests are errors by default and "block
downstream resources from running"; Dagster's checks do not block unless `blocking=True`; Foundry's code transforms
choose `FAIL` or `WARN` per check, its Pipeline Builder has one severity ("If any expectations fail, the build will
fail") and its health checks cannot stop a build at all ([dbt:
build](https://github.com/dbt-labs/docs.getdbt.com/blob/current/website/docs/reference/commands/build.md); [Dagster:
Asset checks](https://github.com/dagster-io/dagster/blob/master/docs/docs/guides/test/asset-checks.md); [Foundry: Data
expectations](https://www.palantir.com/docs/foundry/pipeline-builder/dataexpectations-overview)). SHACL shows the
standards catching up. In the 2017 Recommendation any result, even an informational one, makes a report non-conforming
([SHACL](https://www.w3.org/TR/shacl/#conforms)). The SHACL 1.2 Core Working Draft of 16 November 2026 makes the failing
severities a parameter of the run that the report must state, says "The same set applies to the validation itself and to
all conformance checks performed during it, including nested ones", and lets a reused shape be switched off or re-graded
from the importing graph without editing the original ([SHACL 1.2
Core](https://www.w3.org/TR/2026/WD-shacl12-core-20261116/#conformanceDisallows)). It is a draft and could change.

**No product read has a state for a day's output that was computed, kept and held for a decision.** In Foundry a failed
`FAIL` expectation aborts the job and the open transaction is discarded ("Any files that were written during the
transaction are ignored"), which leaves readers on the last committed view (the notes infer that last step from how
views are defined). Palantir's documented gate is a hand-written "Fusion Validated" copy of an unstable input, and a
deliberate decision not to publish today is a line of code, `ctx.abort_job()` ([Foundry:
Datasets](https://www.palantir.com/docs/foundry/data-integration/datasets); [Foundry: Stability
recommendations](https://www.palantir.com/docs/foundry/maintaining-pipelines/stability-recommendations); [Foundry: Abort
transactions](https://www.palantir.com/docs/foundry/transforms-python/abort-transactions)). Alteryx's desktop equivalent
is a Control Container that runs the writing tools only if a check stream has records; its cloud Approval task times out
to failed, not to held ("If the timeout is reached before approval is given, the task will fail"); and its
Trifacta-heritage data quality rules only report, on a job that can complete with invalid steps skipped ([Alteryx help:
Control Container](https://help.alteryx.com/designer/current/en/tools/developer/control-container-tool.html); [Alteryx
help: Approval Task](https://help.alteryx.com/orchestrator/en/plan-tasks/approval-task.html); [Alteryx help: Job Details
Page](https://help.alteryx.com/trifacta-classic/en/basics/running-job-basics/job-details-page.html)). OpenLineage's six
run states have none for built and withheld
([OpenLineage](https://github.com/OpenLineage/OpenLineage/blob/main/spec/OpenLineage.json)). The nearest precedents are
outside the visual tools. SQLMesh audits a changed model before promotion, so that "Invalid data is contained in an
isolated table and never reaches the production environment"; RDF4J validates on commit and throws an exception that
carries the validation report; Confluent's schema rules carry a dead-letter-queue action that sets a failing record
aside, verified here only as names in its source code ([SQLMesh:
Auditing](https://github.com/TobikoData/sqlmesh/blob/main/docs/concepts/audits.md); [RDF4J:
SHACL](https://github.com/eclipse-rdf4j/rdf4j/blob/main/site/content/documentation/programming/shacl.md); [Confluent:
Rule.java](https://github.com/confluentinc/schema-registry/blob/master/client/src/main/java/io/confluent/kafka/schemaregistry/client/rest/entities/Rule.java)).

Time is handled less carefully than hierarchy. Most products show the latest result and a trend: Purview keeps "the last
50 runs" of an asset, and Foundry's health tab shows a strip of about ten past results per check (seen in a screenshot).
Foundry can judge nine kinds of check against a dataset's own recent builds by a "Median deviation" built on the median
absolute deviation, but only for scalar measures such as row count and null percentage; this corrects an earlier reading
in the notes that it had no history-relative checks ([Foundry: Checks
reference](https://www.palantir.com/docs/foundry/health-checks/checks-reference)). The one documented design that
combines hierarchy and days is Statuspage's: a day is coloured by weighted minutes of trouble with a deliberate jump at
the first minute ("the day immediately jumps to half-way between green and yellow"), days with no data are grey, and
hovering a collapsed group's bar "shows how many components were impacted, and clicking will expand the group"
([Statuspage: historical
uptime](https://support.atlassian.com/statuspage/docs/display-historical-uptime-of-components)). On narrow screens four
rules are documented in source code: draw only the most recent periods that fit (Uptime Kuma), merge equal neighbours
and split them only when each gets 8 pixels (Dagster), keep fixed 18-pixel cells scrolling behind a sticky label column
(Airflow), and page the rows (Grafana) ([Uptime
Kuma](https://github.com/louislam/uptime-kuma/blob/master/src/components/HeartbeatBar.vue); [Dagster UI
source](https://github.com/dagster-io/dagster/blob/master/js_modules/ui-core/src/partitions/PartitionStatus.tsx);
[Airflow grid
constants](https://github.com/apache/airflow/blob/main/airflow-core/src/airflow/ui/src/layouts/Details/Grid/constants.ts);
[Grafana: State
timeline](https://github.com/grafana/grafana/blob/main/docs/sources/visualizations/panels-visualizations/visualizations/state-timeline/index.md)).
By the notes' arithmetic a 31-day month on a 390-pixel phone gets about 11.5 pixels a day, under the 24-pixel minimum
target of WCAG 2.5.8, so day marks are for reading and another control has to pick the day; none of these displays was
tested at phone width ([WCAG 2.5.8](https://github.com/w3c/wcag/blob/main/understanding/22/target-size-minimum.html)).

One controlled study supports the usual advice on encoding. NN/g tested four ways of marking list items on phone screens
with 96 participants: marks that differed in both colour and icon were found fastest, and text alone "was 57% slower
than the best performing condition" ([NN/g: Visual
indicators](https://www.nngroup.com/articles/visual-indicators-differentiators/)). IBM's Carbon caps a view at "five or
six indicators", and NN/g's tooltip guidance matters most for touch: tooltips "are not normally available on
touchscreens" and must not carry vital information, yet most of the displays read keep their counts and causes in hover,
with Dagster's counts printed on the node as the exception ([Carbon: Status
indicators](https://github.com/carbon-design-system/carbon-website/blob/main/src/pages/patterns/status-indicator-pattern/index.mdx);
[NN/g: Tooltip guidelines](https://www.nngroup.com/articles/tooltip-guidelines/)). Three things were not found in any
source: a tool that shows a nested component as one node and drills its status through tiers in a time matrix; a rule
for rolling a group's status up over time; and a join's match rate kept from run to run.

### Vendors identify by path and version number; only code-first tools hash, and they hash three things

#### Components and their outputs

In Alteryx a reusable piece is identified by where its file is, by an asset id, or by a version number that the platform
assigns. **None of the roughly 130 help pages read mentions a checksum, hash, digest or signature** of a workflow,
macro, package, version or dataset; the word "hash" appears only in Compare Workflows' "hashed indicator" ([Alteryx
help: Workflow Management](https://help.alteryx.com/designer/current/en/workflows/workflow-management.html); [Alteryx
help: Compare Workflows](https://help.alteryx.com/designer/current/en/workflows/compare-workflows.html)). Certification
is a label on a version that the platform drops when content changes, and promotion packages are immutable, so trust
rests on the platform's rule and not on a digest a third party could check ([Alteryx help: Data Labels and Asset
Certification](https://help.alteryx.com/platform/en/admin/admin-reference/admin-console/data-labels-and-asset-certification.html)).
Foundry identifies by resource, branch and transaction. An output is fresh when "input datasets and the logic specified
within the JobSpec have not changed since the last time the output dataset was built"; a change of logic is a change in
a version string over a transform's modules and dependencies, and a change of input is a comparison of transactions, not
of contents ([Foundry: Builds](https://www.palantir.com/docs/foundry/data-integration/builds); [Foundry: Python
transforms](https://www.palantir.com/docs/foundry/transforms-python/transforms-pipelines)). A search of every downloaded
Foundry page and of its GxP whitepaper found hashing only as a data transform, as a per-row cache key for LLM steps and
as the code-signed export file of a Marketplace product ([Foundry GxP
whitepaper](https://www.palantir.com/assets/xrfr7uokpv1b/2kkdJ4XMOyLM1HAWrQeUlg/b90207bc931dba0a53ad2a2434548280/Foundry_GxP_and_Quality_Management_Whitepaper.pdf);
[Foundry: Export and import products](https://www.palantir.com/docs/foundry/foundry-devops/export-import-products)).
Both findings are silences in documentation, not proof about the products, and the notes say so.

The code-first tools share one shape: **identity is a hash of a unit's own definition and the sorted identities of its
children**. SQLMesh's fingerprint is four hashes (data, metadata, parent data, parent metadata), from which it derives a
`version` over data only and an `identifier` over everything, so that a changed description, owner or audit is recorded
without rebuilding anything ([SQLMesh
source](https://github.com/TobikoData/sqlmesh/blob/main/sqlmesh/core/snapshot/definition.py)). Dagster's default data
version is a SHA-256 over the code version and the sorted input data versions ([Dagster
source](https://github.com/dagster-io/dagster/blob/master/python_modules/dagster/dagster/_core/definitions/data_version.py)).
The Bazel Remote Execution API digests an Action whose input root is a Merkle tree in canonical form, and includes on
purpose things that look like metadata: "two `Actions` with different timeouts are different, even if they are otherwise
identical" ([Remote Execution
API](https://github.com/bazelbuild/remote-apis/blob/main/build/bazel/remote/execution/v2/remote_execution.proto)). Names
are handled deliberately. Git keeps a file's name out of the blob and in the tree entry that points at it, SQLMesh keeps
a model's name beside its hash, and dbt builds a node's identity from names, which turns a rename into a removal and an
addition ([Pro Git: Git
objects](https://github.com/progit/progit2/blob/main/book/10-git-internals/sections/objects.asc); [dbt:
manifest](https://github.com/dbt-labs/docs.getdbt.com/blob/current/website/docs/reference/artifacts/manifest-json.md)).
One caution comes from the notes' reading of the code and is the researcher's judgement, not the projects': SQLMesh
hashes with CRC32 and Dagster concatenates version strings with no separator, which serves staleness and does not serve
audit ([SQLMesh hashing](https://github.com/TobikoData/sqlmesh/blob/main/sqlmesh/utils/hashing.py)).

These systems keep four identities apart that are often run together: a stable object id that survives renames (Nessie's
Content Id, the numeric repository id in GitHub's workflow lockfile, Iceberg's column ids), the hash of the definition,
an identity for the interface, and the identity of each output's data ([Nessie
specification](https://github.com/projectnessie/nessie/blob/main/site/docs/develop/spec.md); [Iceberg:
Evolution](https://github.com/apache/iceberg/blob/main/docs/docs/evolution.md)). An interface hash exists in few places,
and they are the instructive ones. dbt builds `contract.checksum` as a SHA-256 over column names, data types and
constraints sorted by name, leaves out the SQL, descriptions and tests, and computes "breaking" by comparing two
contracts: a removed column or a changed type breaks, an added column is "a change (caught by the different checksums),
but not a breaking change", and the consequence is "a warning unless the model is versioned, then it's an error"
([dbt-core source](https://github.com/dbt-labs/dbt-core/blob/1.11.latest/core/dbt/contracts/graph/nodes.py)). Avro's
Parsing Canonical Form keeps seven attributes and strips the rest before fingerprinting, so its fingerprint identifies
the wire layout and nothing more ([Avro
specification](https://github.com/apache/avro/blob/main/doc/content/en/docs/++version++/Specification/_index.md)).
Confluent goes the other way, with one identifier over schema text, references, metadata and rules together ([Confluent:
Schema.java](https://github.com/confluentinc/schema-registry/blob/master/client/src/main/java/io/confluent/kafka/schemaregistry/client/rest/entities/Schema.java)).

Whether a rebuilt but identical output disturbs what reads it depends on what is hashed. **Only systems that identify
outputs by content cut off early**: "When it executes a task and the result is unchanged from the previous build, it is
unnecessary to execute the dependent tasks" ([Build Systems à la
Carte](https://github.com/snowleopard/build/blob/main/papers/jfp/2-background.tex)). Bazel, Hamilton and DVC do so; Nix
does so only for content-addressed derivations, which still need the `ca-derivations` experimental feature; Dagster and
Flyte do so only when user code supplies a content hash ([Hamilton:
Caching](https://github.com/apache/hamilton/blob/main/docs/concepts/caching.rst); [DVC: Internal
files](https://github.com/iterative/dvc.org/blob/main/content/docs/user-guide/project-structure/internal-files.md); [Nix
manual:
Content-addressing](https://github.com/NixOS/nix/blob/master/doc/manual/source/store/derivation/outputs/content-address.md);
[Dagster: Asset
versioning](https://github.com/dagster-io/dagster/blob/master/docs/docs/guides/build/assets/asset-versioning-and-caching.md)).
The SQL transformation tools decide from definitions. SQLMesh approximates a cut-off by classifying each change, and its
automatic categoriser returns non-breaking only when projections were added; dbt State hashes the parsed query, so that
whitespace and comments no longer rebuild, and reads the warehouse's last-modified timestamps for data ([SQLMesh
categorizer](https://github.com/TobikoData/sqlmesh/blob/main/sqlmesh/core/snapshot/categorizer.py); [dbt: How dbt State
works](https://github.com/dbt-labs/docs.getdbt.com/blob/current/website/blog/2026-06-17-how-dbt-state-works.md)). The
notes infer that these workarounds exist because warehouses give no cheap content hash.

In data tools a reference floats unless something records its resolution. dbt's unpinned `ref` resolves to the latest
version and says so, offering both moves in the message ("Try out v3", "Pin to v2"); its packages are pinned by a lock
file until `dbt deps --upgrade`; GitHub's workflow lockfile records the reference, the commit ("The exact commit the
reference resolved to. This is the code that will run.") and the repository's numeric id, and each unit carries its own
lock: "A reusable workflow's dependencies are covered by the lockfile of the repository where it's defined, not by the
lockfile of the repository that calls it" ([dbt: Model
versions](https://github.com/dbt-labs/docs.getdbt.com/blob/current/website/docs/docs/mesh/govern/model-versions.md);
[GitHub: Workflow dependency
lockfiles](https://github.com/github/docs/blob/main/content/actions/concepts/security/workflow-dependency-lockfiles.md)).
The preview that works is the same computation everywhere. SQLMesh's plan lists directly and indirectly modified models
with a category each and the dates affected, applies nothing until it is approved, and then promotes by swapping a
pointer ([SQLMesh: Plans](https://github.com/TobikoData/sqlmesh/blob/main/docs/concepts/plans.md)). For nested runs
three mechanisms compose: run-id links (OpenLineage's parent facet now carries the root run as well), statements bound
by digest (an in-toto subject "MUST have `digest` set", and SLSA separates the parameters a caller chose from the
`resolvedDependencies` they resolved to, in a text that is still a working draft on its main branch), and append-only
logs ([OpenLineage:
ParentRunFacet](https://github.com/OpenLineage/OpenLineage/blob/main/spec/facets/ParentRunFacet.json); [in-toto
Statement](https://github.com/in-toto/attestation/blob/main/spec/v1/statement.md); [SLSA
provenance](https://github.com/slsa-framework/slsa/blob/main/spec/build-provenance.md)). Nix's manual states the limit
of all three: "there is no way to audit a build trace entry except for by performing the build again from scratch" ([Nix
manual: Build trace](https://github.com/NixOS/nix/blob/master/doc/manual/source/store/build-trace.md)).

Every system has paid for the same mistakes. Hashing text instead of meaning rebuilds on a comment, which is why dbt
moved from file hashes to syntax-tree hashes. Letting time or the environment leak into a definition makes a new
identity at every parse: Airflow calls it "Dag version inflation" and since 3.2 flags values such as `datetime.now()` by
static analysis ([Airflow: FAQ](https://github.com/apache/airflow/blob/main/airflow-core/docs/faq.rst)). Leaving an
input out serves wrong results silently: Bazel "does not track tools outside a workspace", so two users with different
compilers "will wrongly share cache hits", and Hamilton "will not version nested function calls" ([Bazel: Remote
caching](https://github.com/bazelbuild/bazel/blob/master/docs/remote/caching.mdx); [Hamilton:
Caching](https://github.com/apache/hamilton/blob/main/docs/concepts/caching.rst)). The mature systems rebuild when
unsure and explain why; dbt State "rebuilds the node to be sure" and ships an explain view.

#### Ontologies and data contracts

Formal ontology languages reuse by importing a whole document named by an IRI, with a stable name for the series and a
version name for one release. OWL 2's rules about where a version's document lives are SHOULDs, and it defines no
checksum: a cached copy must be "the same as if the ontology were accessed" by its IRI, and nothing checks it ([OWL 2
Structural Specification](https://www.w3.org/TR/owl2-syntax/#Ontology_Documents)). The SHACL 1.2 Core Working Draft adds
imports by version IRI for shapes graphs and calls a closure that mixes two versions of one series ill-formed ([SHACL
1.2 Core](https://www.w3.org/TR/2026/WD-shacl12-core-20261116/#shapes-graph)). Across the standards and products read, a
shared model reaches its user in three ways. It is a **pinned whole-document import** (OWL by version IRI, FHIR package
dependencies, Confluent's schema references, dbt packages through a lock file); an **extracted, self-contained copy that
records where each part came from** (the Common Data Model's resolved entity with its `attributeContext` graph, ROBOT's
extracts stamped with `rdfs:isDefinedBy`, LinkML's merged imports closure); or a **live reference** (a FHIR canonical
reference with no version, Fabric's inheritance) ([Microsoft Learn: Resolving a CDM
entity](https://learn.microsoft.com/en-us/common-data-model/sdk/convert-logical-entities-resolved-entities); [ROBOT:
extract](https://github.com/ontodev/robot/blob/master/docs/extract.md); [LinkML:
imports](https://github.com/linkml/linkml/blob/main/docs/schemas/imports.md)). **No pinned import in the formal stack is
checked by content.**

The operational ontologies of 2026 agree on a split into three layers: the concept model, its binding to physical
tables, and the consumer's view. **Bindings never travel.** In Microsoft Fabric "A derived entity type has no binding at
creation", and a shared property "stays unbound and available for other entity types to reference and bind
independently"; Apache Ossie writes the binding as a separate mapping document; the Common Data Model shares definitions
with no data and lets a manifest "borrow" entities that it can only read ([Fabric:
inheritance](https://github.com/MicrosoftDocs/fabric-docs/blob/main/docs/iq/ontology/how-to-use-inheritance.md);
[Fabric: reuse
properties](https://github.com/MicrosoftDocs/fabric-docs/blob/main/docs/iq/ontology/how-to-reuse-properties.md);
[Microsoft Learn: CDM manifest](https://learn.microsoft.com/en-us/common-data-model/sdk/manifest)). Reuse across models
is weak everywhere: Fabric documents no import between ontology items, Ossie says "This specification does not define a
bundle format or cross-model references", and Foundry maps one ontology to one space ([Apache Ossie core
specification](https://github.com/apache/ossie/blob/main/core-spec/spec.md); [Foundry:
Ontologies](https://www.palantir.com/docs/foundry/ontologies/ontologies-overview)). Inside one Foundry ontology the
three reuse constructs propagate in three ways, and in none does a consumer pin a version. A shared property is a live
reference with "Detach" as the way out; a value type's non-breaking versions "automatically propagate to the Ontology",
which corrects an earlier reading in the notes that consumers choose when to move; and an interface cannot gain a
required member unless every implementation changes "in the same update to your Ontology" ([Foundry: Value type
versions](https://www.palantir.com/docs/foundry/object-link-types/value-types-versions); [Foundry: Edit an interface
definition](https://www.palantir.com/docs/foundry/interfaces/edit-interface-definition)). Versioning is as thin.
Fabric's ontology item, still in preview on 16 November 2026, has named snapshots with restore and no comparison,
although its text definition takes part in Git with a `lineageTag` that survives renames ([Fabric: version
history](https://github.com/MicrosoftDocs/fabric-docs/blob/main/docs/iq/ontology/how-to-use-version-history.md);
[Microsoft Learn: Ontology
definition](https://learn.microsoft.com/en-us/rest/api/fabric/articles/item-management/definitions/ontology-definition)).
Neither product lets an author say that a rule applies from a given day; that is the notes' reading of both sets of
pages, not a statement either vendor makes.

"An ontology with rules" in vendor language does not mean a gate. Fabric says so directly: "A business rule is a
natural-language definition. Ontology doesn't run the rule against data or execute actions" ([Fabric:
rules](https://github.com/MicrosoftDocs/fabric-docs/blob/main/docs/iq/ontology/how-to-use-rules.md)). Foundry enforces
required properties, value type constraints and key uniqueness when data is indexed, and for batch data that is all or
nothing: "violations will cause indexing jobs to fail", while a stream drops the offending record ([Foundry: Data
restrictions](https://www.palantir.com/docs/foundry/object-indexing/data-restrictions)). Neither flags a row and lets
the rest through, and neither holds a day for a decision.

Data contracts have consolidated around Bitol's Linux Foundation standards. ODCS v3.2.0 describes a schema whose
elements have ids that are "Stable across renames and refactoring", quality rules of four kinds with a threshold, a
dimension and a severity, and service levels; it does not say what a failed rule does ([ODCS:
references](https://github.com/bitol-io/open-data-contract-standard/blob/main/docs/references.md); [ODCS: data
quality](https://github.com/bitol-io/open-data-contract-standard/blob/main/docs/data-quality.md)). ODPS v1.1.0 describes
a product's ports: input ports are "Expectations [Optional]" and output ports "Promises [Required]", each pointing at a
contract by id and version ([ODPS: product
information](https://github.com/bitol-io/open-data-product-standard/blob/main/docs/product-information.md)). The Open
Data Mesh descriptor adds the one propagation rule found: "Everytime the major version of port changes also the major
version of the product MUST be incremented" ([DPDS
1.0.0](https://github.com/opendatamesh-initiative/odm-specification-dpdescriptor/blob/main/versions/1.0.0.md)). None of
them computes compatibility, and **none defines a canonical form or a hash of the contract itself**: hashes appear only
on data files, and DCAT 3 is explicit that its checksum "is related to the download URL" ([DCAT
3](https://www.w3.org/TR/vocab-dcat-3/#dataset-versions)).

Machine-checked reuse lives in the schema world. Buf sorts breaking changes by what would break (generated code per file
or per package, the JSON encoding, the binary encoding), and Confluent declares a compatibility level against the last
or all earlier versions ([Buf](https://github.com/bufbuild/buf/blob/main/README.md); [Confluent:
SchemaRegistryConfig](https://github.com/confluentinc/schema-registry/blob/master/core/src/main/java/io/confluent/kafka/schemaregistry/rest/SchemaRegistryConfig.java)).
Apollo runs three checks before a subgraph change is published: whether the supergraph still composes, whether recorded
client operations "seen in the last seven days" would break, and whether each named downstream variant, marked blocking
or not, still holds; `publish --check` then makes check and publish one step, because otherwise "Another team member
could publish a change between your check and your publish" ([Apollo
Rover](https://github.com/apollographql/rover/blob/main/docs/source/commands/subgraphs.mdx)). Immutability of a
published version is a service's rule: in Azure Digital Twins "the model interface is immutable", versions coexist, and
each twin is moved by an explicit patch ([Azure Digital Twins: Manage
models](https://learn.microsoft.com/en-us/azure/digital-twins/how-to-manage-model)). FHIR adds a scoping rule and an
override: a reference without a version resolves first inside the referring package's own dependencies, and a manifest
can impose versions from outside ([FHIR: references](https://github.com/HL7/fhir/blob/master/source/references.html)).
For hashing itself, RFC 8785 gives canonical JSON (an Informational RFC that two W3C Recommendations nevertheless sign
over), RDFC-1.0 gives canonical bytes for RDF and "does not define such a graph signature", and the W3C's Data Integrity
Recommendation warns both that whatever a canonical form leaves out is unprotected and that implementers "are strongly
urged not to invent or use new mechanisms" ([JSON Canonicalization
Scheme](https://github.com/cyberphone/json-canonicalization); [RDF Dataset
Canonicalization](https://www.w3.org/TR/rdf-canon/); [Verifiable Credential Data
Integrity](https://www.w3.org/TR/vc-data-integrity/)).

### Leading tools open an unfamiliar table with a summary of every column and a join with what did not match

The convergent design is a small distribution in or beside each column header, a quality line, a row count with a plain
statement of whether it is a sample, and a detail view per column. MotherDuck names the two principles, "High-density,
easy to read" and "Details on demand", and shows "value frequencies, NULL percentages, histograms for numeric columns,
and time-series charts for timestamp columns" for any table or result set ([MotherDuck: Column
Explorer](https://motherduck.com/blog/introducing-column-explorer/)). The verified tools agree on defaults by type:
numbers get a histogram with minimum, maximum, mean and quartiles; categories their top values with counts and a
distinct count; dates counts over time; text its length statistics and not its values; every type its share of nulls
([Datasette changelog](https://github.com/simonw/datasette/blob/main/docs/changelog.rst); [DuckDB:
SUMMARIZE](https://github.com/duckdb/duckdb-web/blob/main/docs/1.4/guides/meta/summarize.md)). Whether a string column
is a category or free text needs a stated rule, and Hugging Face publishes one: a label if its unique values are at most
20% of rows and fewer than 1,000, or at most 10 ([Hugging Face dataset
viewer](https://github.com/huggingface/dataset-viewer/blob/main/docs/source/statistics.md)).

Alteryx and Foundry both attach exploration to a node, with caps. Alteryx Designer shows data at any anchor after a run,
limited to 1 MB an anchor, and profiles fully only through a Browse tool: for each column a four-colour quality bar (OK,
Not OK, Null, Empty), the top 5 values, charts of the top 50 and up to 1,000 distinct values, with profiling stopped at
300 MB ([Alteryx help: Browse Tool](https://help.alteryx.com/designer/current/en/tools/in-out-tools/browse-tool.html);
[Alteryx help: Results Window](https://help.alteryx.com/designer/current/en/workflows/results-window.html)). Its bar is
a formatting check for white space, nulls and empties. The Trifacta-heritage grid has the stronger form, Valid,
Mismatched and Missing against the column's declared type, with a histogram on every column and suggested fixes from a
clicked segment ([Alteryx help: Data Quality
Bars](https://help.alteryx.com/trifacta-classic/en/reference/ui-reference/transformer-page/data-grid-panel/data-quality-bars.html)).
Foundry's Pipeline Builder previews up to 500 rows of any selected node and computes statistics on demand: for strings
"histograms of values and value lengths and counts of string casing, whitespace, and null instances", for numbers a
distribution and basic statistics, computed "across this sample" when the input is sampled ([Foundry: Preview
pipeline](https://www.palantir.com/docs/foundry/pipeline-builder/outputs-preview-pipeline)). Deeper questions send the
user to another application.

Three interaction rules recur. First, **the scope of a summary is stated where the summary is**: Tableau Prep puts a
"Sampled" badge beside the row count and its help names the bias of the cheap sample, and Power Query says "Column
profiling based on top 1000 rows" until it is switched to the entire data set ([Tableau Prep: Examine your
data](https://help.tableau.com/current/prep/en-us/prep_explore.htm); [Power Query: data profiling
tools](https://learn.microsoft.com/en-us/power-query/data-profiling-tools)). Second, linking summaries means one of two
things. Filtering narrows the rows, with the settled rule that a summary is never filtered by its own selection
([Mosaic](https://github.com/uwdata/mosaic/blob/main/docs/core/index.md)). Highlighting leaves the rows alone: in
Tableau Prep a clicked value lights its share inside every other field in blue, and filtering is a second, explicit act
("Keep Only" or "Exclude") that leaves a mark on the flow's node. Third, the best tools keep exploration convertible
into work. Alteryx's grid manipulations become real tools on the canvas, Datasette lists every query behind its column
statistics with a link to the SQL editor, and Observable's table engine has "valid" and "not valid" for the column's
type as filters of their own ([Observable stdlib](https://github.com/observablehq/stdlib/blob/main/src/table.js)).

For what changed between two versions, the designs ask for a key. Foundry's Time Travel, in beta, shows "Added rows,
Removed rows, Modified rows and cells, when a key column is available", treats a change as a removal and an addition
without one, and can search history for the version where a row or value first changed ([Foundry: Time
Travel](https://www.palantir.com/docs/foundry/dataset-preview/time-travel)). SQLMesh's table diff reports rows common to
both sides and rows on one side only, then a match percentage per column over the common rows ([SQLMesh: table
diff](https://github.com/TobikoData/sqlmesh/blob/main/docs/guides/tablediff.md)).

The clearest join designs report, at the moment of joining, how much of each side matched, and lead straight to the
values that did not. Alteryx makes the unmatched rows outputs by construction: its Join tool emits L, J and R, the left
rows that did not join, the joined rows and the right rows that did not join ([Alteryx help: Join
Tool](https://help.alteryx.com/designer/current/en/tools/join/join-tool.html)). Its Trifacta-heritage product shows a
match percentage per key pair with matches and non-matches, and the rows in the output ([Alteryx help: Join
Metrics](https://help.alteryx.com/trifacta-classic/en/reference/join-metrics.html)). In Tableau Prep the Included and
Excluded bars are themselves the buttons that isolate those rows, and unmatched key values appear in red and can be
edited in place; the page prints no percentage, which corrects an earlier reading in the notes ([Tableau Prep:
join](https://help.tableau.com/current/prep/en-us/prep_combine.htm)). Power Query prints one sentence, "The selection
matches 8 of 9 rows from the first table" ([Power Query: fuzzy
merge](https://learn.microsoft.com/en-us/power-query/merge-queries-fuzzy-match)). Tableau's relationships reduce
cardinality and referential integrity to four plain options, with the advice to read them as "yes" and "I don't know"
([Tableau: relationships](https://help.tableau.com/current/pro/desktop/en-us/datasource_relationships_perfoptions.htm)).
Foundry is the weak case: its Pipeline Builder join form previews both sides and the result and describes no match rate,
and Contour's advice is to "look at a table of the joined set" ([Foundry: Join
data](https://www.palantir.com/docs/foundry/pipeline-builder/transforms-join-data); [Foundry: Contour
joins](https://www.palantir.com/docs/foundry/contour/boards-join)). Two cautions apply to any design. Data Factory warns
that sampled previews make joins unreliable ("your join conditions might fail"), and dbt's column-level lineage reflects
only select lists, so join keys and filters are missing from it ([Data Factory: debug
mode](https://github.com/MicrosoftDocs/azure-docs/blob/main/articles/data-factory/concepts-data-flow-debug-mode.md);
[dbt: Column-level
lineage](https://github.com/dbt-labs/docs.getdbt.com/blob/current/website/docs/docs/explore/column-level-lineage.md)).
After a join has run, none of these tools keeps the counts.

On scale and on phones the evidence is thinner. Two project READMEs put in-browser cross-filtering at about ten million
rows: Falcon's browser engine "scales up to ten million rows", and Mosaic pre-aggregates the view being brushed over
DuckDB-WASM, limited by "WebAssembly's lack of parallel processing"
([Falcon](https://github.com/vega/falcon/blob/master/README.md); [Mosaic: why
Mosaic](https://github.com/uwdata/mosaic/blob/main/docs/why-mosaic/index.md)). For phones, documented practice comes
from general table patterns and not from profiling tools. Datasette turns rows into stacked cards below 577 pixels and
moves column actions and statistics into dialogs; NN/g finds that "only 2 columns may fit legibly" when cells hold words
and that cards make comparison "cognitively effortful and slow" ([Datasette
stylesheet](https://github.com/simonw/datasette/blob/main/datasette/static/app.css); [NN/g: Mobile
tables](https://www.nngroup.com/articles/mobile-tables/); [NN/g: Data
tables](https://www.nngroup.com/articles/data-tables/)). None of the profiling tools documents a phone layout, and no
controlled study of profiling on a phone was found.

### Trusted products write a two-tone rule: plain where people work, playful where they arrive

Every style guide read puts clarity above humour and treats humour as a tone that context switches off. Mailchimp, the
usual reference for a playful voice, writes "it's always more important to be clear than entertaining" and keeps its
mascot silent: "He smiles, winks, and sometimes high-fives, but he does not talk" ([Mailchimp: Voice and
Tone](https://styleguide.mailchimp.com/voice-and-tone/)). NN/g's measurement gives the reason that matters for a product
built on trust. In an online survey of 100 people rating paired pages for invented companies, "52% of the variability in
the desirability scores is explained by trustworthiness" and friendliness "only explains an extra 8%"; a playful
car-insurance page was rated friendlier by 0.3 points on a 5-point scale and less trustworthy by 0.3 ([NN/g: Tone of
voice and brand perception](https://www.nngroup.com/articles/tone-voice-users/)). The tones that won were "casual,
conversational, and moderately enthusiastic", and one humorous page did win on every measure, so the finding is about
risk and not a ban. The study is small, and its author warns that results depend on the users, the message and the
brand.

The guides agree on where play goes. Sentry's brand file gives a table: "Plain Speech" for product interface,
documentation, error messages, settings and transactional email; its "Sentry Voice" for 404 pages, empty states,
onboarding and loading; and "Default to Plain Speech unless the context specifically calls for personality" ([Sentry
brand guidelines](https://github.com/getsentry/skills/blob/main/skills/brand-guidelines/SKILL.md)). PostHog, whose brand
is deliberately odd, holds its product to "Clarity > cleverness" ([PostHog
handbook](https://github.com/PostHog/posthog.com/blob/master/contents/handbook/brand/in-practice.md)). GitHub's Primer
says "Humor isn't welcome in all situations, for example: in errors, when waiting, or when something fails", and bans
playful graphics from an error screen while allowing them on a first-run screen ([Primer:
Content](https://github.com/primer/design/blob/main/content/foundations/content.mdx); [Primer: Empty
states](https://github.com/primer/design/blob/main/content/ui-patterns/empty-states.mdx)). NN/g adds repetition as the
limit: "Avoid humor since it can become stale if users encounter the error frequently" ([NN/g: Error-message
guidelines](https://www.nngroup.com/articles/error-message-guidelines/)).

Every regret found involved repetition, an audience that did not choose the joke, or failure. Docker froze its generator
of random container names with the comment that "the conflicts of opinion became greater than the added joy" ([Docker
names generator](https://github.com/moby/moby/blob/v24.0.0/pkg/namesgenerator/names-generator.go)). The other cases are
known here only from search summaries: Mailchimp's "party pooper mode", added after British users asked to switch the
jokes off; Twitter's retired Fail Whale; and Ant Design's hidden Christmas change, which appeared in other people's
production applications. The repair that works is an off switch built in from the start: Metabase ships "Doing
science..." as its default loading text beside two plain alternatives, and Homebrew's beer mug has `HOMEBREW_NO_EMOJI`
([Metabase: Appearance](https://github.com/metabase/metabase/blob/master/docs/configuring-metabase/appearance.md);
[Homebrew manpage](https://github.com/Homebrew/brew/blob/main/docs/Manpage.md)). The pattern that best fits a serious
tool with a playful brand is MotherDuck's. Its themed noun always has a plain gloss beside it (its "Ducklings" sit under
the label "COMPUTE"), and its product pages are literal: "A solid dot finished, a spinning ring is still running and a
hollow outline hasn't started. Failed steps turn red, so they're hard to miss" ([MotherDuck](https://motherduck.com/);
[MotherDuck: Flight Explainer](https://motherduck.com/blog/flight-explainer/)).

Naming guidance is as consistent. Shopify's Polaris says "Put clarity above creativity" and "Features should always have
descriptive names. Standalone products that require independent branding can use evocative names"; Microsoft says "Don't
apply a new meaning to an ordinary word"; Apple's Swift guidelines say "Don't surprise an expert" ([Polaris:
Naming](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/content/naming.mdx); [Microsoft Style
Guide](https://learn.microsoft.com/en-us/style-guide/word-choice/dont-use-common-words-in-new-ways); [Swift API Design
Guidelines](https://github.com/swiftlang/swift-org-website/blob/main/documentation/api-design-guidelines/index.md)). The
record of renames runs one way, from odd to plain: Dagster 0.13.0 replaced solids and composite solids with ops and
graphs for "increased clarity", and PostHog documents its query language as "SQL" while keeping "HogQL" as the internal
name ([Dagster 0.13.0 changelog](https://github.com/dagster-io/dagster/blob/0.13.0/CHANGES.md); [PostHog:
SQL](https://github.com/PostHog/posthog.com/blob/master/contents/docs/sql/index.mdx)). The W3C's guidance for cognitive
accessibility treats a metaphor like a joke: "Do not use metaphors and similes unless you include an explanation" ([W3C:
Making Content Usable](https://www.w3.org/TR/coga-usable/)). Across about twenty tools the nested unit is called "sub"
plus the host's noun (subflow, subgraph, sub-workflow), a more distinctive word marks the reusable kind (component,
blueprint, mapping), reuse needs two words for the definition and its placement (template and instance, main component
and instance), and tools that manage a link need a third word for its state (stale, locked, disabled).

The candidate vocabulary for smaltfl splits cleanly. Glass and mosaic words fit the idea and are free on npm and PyPI,
where smalto, emblema, murrine, millefiori and frit returned no package on 16 November 2026 ([npm registry:
smalto](https://registry.npmjs.org/smalto)). They are also obscure. An emblema is a mosaic panel made ready in the
workshop and set whole into a larger floor, and smalto is the coloured glass piece of a mosaic and a doublet of smalt;
both definitions come from search summaries of Britannica and Merriam-Webster and need checking against the pages before
public use ([Britannica: Emblema](https://www.britannica.com/art/emblema-art); [Merriam-Webster:
smalto](https://www.merriam-webster.com/dictionary/smalto)). Two glass words are taken where it matters: Tessera is "a
Go library for building tile-based transparency logs", the field of smaltfl's own signed record, and cullet has been an
npm catalogue of reusable TypeScript building blocks since May 2026
([Tessera](https://github.com/transparency-dev/tessera); [npm registry: cullet](https://registry.npmjs.org/cullet)). The
water words are familiar and nearly all taken in data tooling, among them Estuary Flow, Rill and Rill Flow, Tributary,
Runnel and three tools called Sluice ([Estuary](https://github.com/estuary/flow);
[Rill](https://github.com/rilldata/rill)). Of the salt idioms, "worth your salt" and "salt of the earth" are safe, while
"grain of salt" means do not fully believe this and "salt away" means stored "often secretly or dishonestly"; a
cryptographic salt is also a different thing from the content hashes the product makes ([Britannica Dictionary: salt,
search summary](https://www.britannica.com/dictionary/salt)). The clash checks covered npm, PyPI and known project pages
only, and no trademark search was done.

### smaltfl should assemble the feature from verified parts and keep the hold no vendor has

smaltfl starts from a different place than every product surveyed. Its keys hash a plan derived from the readable
document, with names and display fields left out; every dataset has an exact content hash; its rules are dated change
sets with a hash of their own; a run that fails its gates is held, staged and decided, and the decision is recorded
([ADR 0004](../adr/0004-the-flow-plan.md); [ADR 0009](../adr/0009-paused-not-published.md); [ADR
0021](../adr/0021-time.md)). Its architecture document already reserves a step kind `flow` for a sub-flow
([ARCHITECTURE.md](../ARCHITECTURE.md)). The survey's use is therefore to choose a structure and avoid documented
failures, not to copy a product. Everything in this section is a recommendation inferred from the verified findings; the
decisions it implies are the maintainers' to make in an ADR.

| Wanted behaviour | What to take | Verified precedent | What to avoid |
|---|---|---|---|
| A flow used inside another flow | One definition, referenced by name in the document and resolved to a pinned, content-hashed copy when the plan is made; ports declared by the component and bound at each use | Flyte's by value and by pointer; dbt's lock file; Foundry's declared inputs mapped per instance; SLSA's chosen parameters against resolved dependencies | Identity by path (classic Alteryx); "latest" resolved at run time with no notice (the Alteryx One default); a unit that cannot leave its pipeline (Foundry's subgraph) |
| Updates reach every flow that uses it | Each placement follows the latest published version or pins one; an update is offered with a note, a diff in words, a breaking-or-not verdict and a preview of the days it would restate, then recorded as a dated change set | KNIME's three targets; NiFi's five states; Figma's publish, review and accept; SQLMesh's plan; Apollo's checks; dbt's contract comparison | Silent arrival at load or run (Simulink, Alteryx One); suspending and resuming an instance's link (Simulink, NiFi) |
| One node with a pass or fail badge | A status derived by precedence of outcomes, with a count ("held, 1 of 12"); a held child always holds the badge; link state as a second, separate mark | Airflow 3's state with child counts; Dagster's fractions; Dataiku's worst-of; OORS's precedence; NiFi's version-state icon | Averages (Purview, Statuspage's group bar); a status written by the component's author (Houdini, Node-RED); counts that live only in hover |
| Opens into its own flow | Enter, with a breadcrumb and an address for each level; open from the placement and show that placement's data and status on every inner step; one tap from the badge to the inner step that holds | ComfyUI's route hash and lifted errors; KNIME's Workflow monitor; per-instance debugging in Simulink and Unreal; Foundry's instance view | Opening the definition without the run's data (Alteryx); preview at the output only (Data Factory flowlets) |
| Outputs usable downstream, for example in joins | Named output ports on the node, each a contract with a stable id; a component that is acyclic with its siblings; an interface hash beside the whole-document hash | Foundry's port rows; KNIME's state per port; dbt's `contract.checksum`; ODPS's promises; Airflow's cycle rule | Wires to inner steps; ports identified by position or count |
| An exploration view for outputs | A card per column (type, a small distribution, the shares that fit the type, do not fit and are empty) with details on a tap; a join summary with matched and unmatched on each side and rows out, kept per run; a diff by key against another day or version | MotherDuck; Tableau Prep; Power Query; Alteryx's L, J and R outputs; Foundry's Time Travel; SQLMesh's table diff | Brushing by hover and drag; a summary that does not say its scope |
| Statuses roll up into the month overview | A component is one row of days whose cell is the worst over its steps, with a count; a tap enters the component's own month; exceptions only | Airflow's group cell; Statuspage's click to expand; Dagster's merged segments; NN/g on accordions | Deep indentation on a phone; a day averaged over children |
| A playful brand that keeps trust | Plain words in the interface; the glass story in the brand layer; play only on first-run screens, success, release notes and sample data; one documented plain mode | Sentry's two-tone table; MotherDuck's glossed nouns; Polaris's naming rule; Metabase's and Homebrew's switches | A joke or mascot on a badge, a held day, a decision sheet or anything about hashes |

**Author by reference, plan by value.** The component stays one definition, so that an update has one home, and
translating a parent resolves each use to a specific version whose plan nodes join the parent's plan under an instance
path. That keeps a parent's plan a pure function of recorded inputs, which is what a floating reference destroys in
Alteryx One and what a lock file restores in dbt and GitHub Actions. The instance path keeps two uses of one component
apart and stays out of the component's own hash, as Git keeps a file's name in the tree entry and not in the blob. Two
forms need different rules and probably different words, as dbt separates a package from a project dependency: a flow
placed inside another and run there is pinned and re-run by the flow that uses it; a join against another flow's
published output follows the producer's own runs and holds. Three identities need adding to the two smaltfl has: a
stable id for a component across versions and renames (Figma: "Every component has a unique id"), stable ids for ports,
and an interface hash. The interface hash sits beside the whole-document hash and never replaces it, because of the
W3C's warning about what a canonical form leaves out. What belongs in it is a real decision: port ids, column names and
types, and the rules in force clearly do; display labels do not; a value label that a rule refers to does. A component
hash is a new hash encoding, which by the repository's own rule goes into an ADR first, with test vectors.

**Early cut-off is available at the component boundary, at a price.** smaltfl today keys a node by its own canonical
form and its inputs' keys, and keys a snapshot by its content ([ARCHITECTURE.md](../ARCHITECTURE.md)). That is input
addressing for every derived node, the scheme under which a change to a shared unit rebuilds everything downstream even
when its output is byte for byte the same. Keying a consumer by the content hash of the component output it reads, as a
snapshot is keyed, gives the rule Bazel and Hamilton use: a component rebuilt to identical outputs leaves every flow
that uses it untouched, with none of SQLMesh's categories or dbt State's column reasoning. The price follows from Nix's
account of content-addressed derivations, which are resolved by replacing each input with what it actually produced: a
consumer's key is then known only after the component has run. That consequence is this report's inference. Recording
both identities for each output, how it was made and what it is, keeps both questions answerable. Each component's
manifest should name its parent run and its root run, and the parent's manifest should carry the digest of each child's
manifest, which makes the link a Merkle link and not a name. The day should enter a component as an explicit, hashed
parameter, and wall-clock functions should be refused inside one; that is Airflow's lesson about version inflation.

**Follow or pin, with an update step that no vendor has in full.** An update that reaches every flow and a run that can
always be reproduced are reconciled the way KNIME, Houdini and Alteryx One reconcile them: per placement, follow or pin.
Alteryx One shows the cost of making "latest" the silent default, and Figma shows the remedy in four parts: announce (a
state on the node, in NiFi's vocabulary), describe (the publisher's note), compare (in labels and words, as ROBOT's diff
does for ontologies, not as a text diff of files), and apply (per placement or all at once) ([ROBOT:
diff](https://github.com/ontodev/robot/blob/master/docs/diff.md)). smaltfl can add what none of them has, because it
records days: a preview of which past days the update would change, which is SQLMesh's plan and Apollo's operation check
in one, and which its restatement machinery already computes for a back-dated rule change. A reasonable reading of
"follow" is Foundry's version range: accept automatically only updates whose interface is unchanged or compatible,
record each as a dated change set that takes effect from the next day to arrive, and say so on the node; an update that
breaks the interface or would restate published days waits for a person. smaltfl has no server, so a publisher can only
run rule-based checks (breaking or not, and why, by named rules as Buf and dbt do), and each flow that uses the
component runs the composition and replay checks itself when it is offered the new version. A check result that names
the hash of what it checked removes the race Apollo documents between checking and publishing. A published version does
not change; a change is a new version beside it, with a date after which the old one is no longer offered. Editing a
placed instance should be by declared overrides only, each visible as an override and reverted in one action, with
detach as the single way out. The where-used list covers only the flows a browser can open, and should say so.

**Derive the badge, keep the hold, and say whose failure it is.** A component's status should be computed from what is
inside, by precedence and with counts. An order adapted from OORS and Airflow serves: could not be judged, then held,
then warned, then passed, with "did not run because something upstream is held" and "not judged yet" counted on their
own and shown neither as failure nor as pass. A held child holds the parent's badge whatever the number of siblings, and
the badge prints the extent, because touch has no hover. One policy for which severities hold applies to a run and to
everything nested in it and is recorded in the manifest, which is SHACL 1.2's rule; a flow that uses a component
tightens or loosens one of its rules only by a visible, recorded local override, never by editing the shared rule, which
is what smaltfl's rule switches already do as change sets. The contract standards add whose failure it is: an input
expectation that fails is the host flow's data, and an output promise that fails is the component's own logic. On
holding, smaltfl is ahead of the field and has no convention to follow. Its existing rule that a step's hold reaches the
outputs built from it is the natural default for a held component, and its existing attribution of a step's finding to
the source that caused it applies automatically the rule that Foundry offers only as configuration advice, to report a
failure once, at the level that owns it ([ADR 0014](../adr/0014-gates.md); [ADR
0020](../adr/0020-the-estate-as-a-company.md)). Over time, count days by outcome and do not average.

**Enter, do not expand, and give the node three channels.** A phone has no room for expansion in place, and the displays
read cap nesting at one or two levels (Statuspage, Tableau Prep, GitLab) or pay for it in indentation. smaltfl's hash
routes already give days, scenes and cards an address; a component level needs one too, with its view remembered. The
node should say its kind by its outline, as Simulink and KNIME do and so that it is not mistaken for a notebook box; its
run outcome by a badge with colour, shape and a count; and its link state (current, newer version available, overridden
here) by a separate corner mark. Since no verified tool combines the last two for a batch run, that design has to be
tested in smaltfl's own judging rounds at all four sizes ([ADR 0018](../adr/0018-phone-tablet-and-desktop.md)). Two
distinct, visible actions are needed, open its flow and explore its outputs, where Alteryx overloads one gesture. A
component opened on its own, outside any flow, should show the data of its last use or a kept sample, which is the
answer n8n gives and the one flowlets lack. In the month overview a component is a row whose day cell is the worst over
what is inside, and a tap enters the component's own month under a breadcrumb ([ADR
0024](../adr/0024-the-month-at-a-glance.md)).

**Let the ontology travel as a checked copy and leave the binding with each use.** A component's ontology (types, rules,
labels) is written against its own ports and travels with it as an extracted closure that records the name, version and
hash of the shared file it was taken from; the mapping from a flow's columns onto those ports belongs to each use. This
joins the two strongest forms found, the Common Data Model's resolved copy with provenance and the pinned import, and
adds the content check that none of the formal standards has. smaltfl's shared ontology import and its contracts in
ODCS's fields are the starting points. Three points need deciding in advance: what happens when two components bring
different versions of one shared ontology file (OWL and SHACL 1.2 say a closure should not, Confluent can reject it,
Azure Digital Twins lets them coexist); that an unpinned reference inside a component resolves against the component's
own closure first, which is FHIR's rule; and that a component with no binding reads as complete, since an unbound model
is a normal state in Fabric, the Common Data Model and Ossie alike. Each port keeps three artefacts apart: the
declaration, the results that point back at its rule ids, and one derived status.

**Explore outputs by column, on the whole file, and keep the join's numbers.** One card per column is the phone form of
a column explorer, within NN/g's budget of two legible columns. smaltfl's engine runs in the page, so it can profile the
whole file and say so in the place where other tools say "Sampled". Tap to highlight, then an explicit keep or exclude
that becomes one of the reader's own cells: that is Tableau Prep's order and Alteryx's "do it in the grid, then apply it
as a step". A join summary needs three figures (left rows matched of the left total, right rows matched of the right
total, rows out), the unmatched values themselves and whether the key is unique, with what was measured today kept apart
from what was only declared. Keeping the match rate for every run would be new: no tool read does it. The exploration
view should open from the placement, so that it shows this use's rows.

**Keep the interface plain and put the glass in the brand.** By Polaris's rule a nested, reusable flow is a feature and
takes a descriptive name. Plain candidates are "sub-flow", which smaltfl's architecture document already uses, "shared
flow", which matches the repository's "shared ontology", and "component", KNIME's and Figma's word; "instance" or "use"
names a placement; and the link's state needs its own short word. One term per concept, chosen by the maintainers, is
the guides' advice. The glass words belong in the brand layer with a literal gloss beside them: the nested node's icon
as a chip of glass set among others (the family's mark already carries a chip), the illustration on an empty library, a
release name, and one line in the documentation that tells the smalto and emblema story once the definitions are
confirmed. Play is safe where it is seen once: the first pass of a component, the empty library, release notes and
sample data, where Larkspur is already fiction. It stays off the badge, the held day, the refused file, the decision
sheet and anything about hashes or signatures. One documented plain mode shows that the play is decoration over a
serious surface. Among the family's salt puns, "worth its smalt" is safe, and "a grain of smalt", "smalt away" and
anything "smalted" say the wrong thing about audited data.

#### Where these recommendations rest on weaker evidence

No product was run in either research pass, so every description of appearance comes from documentation, and for
Foundry, KNIME, Dataiku and Simulink partly from screenshots of single examples. The absence of content hashing in
Alteryx and Foundry is silence in documentation. Community evidence (Alteryx's forums, Palantir's community, KNIME's
forum, Dataiku's community, outside reviews of Foundry) was read only as search extracts and is used above only where a
vendor page says the same. The research literature on nested diagrams, and the papers on glanceable displays and
dashboards, were reached through summaries or recalled, and decide nothing here. Three sources that this report leans on
are drafts that could change: SHACL 1.2 (Working Drafts, none yet a Candidate Recommendation), OORS (v0.8.1) and the
SLSA text on its main branch. The case against composite scores is vendor and practitioner writing plus one 2002 paper.
The tone study is one survey of 100 people about invented companies, the brand regrets other than Docker's are anecdotes
from search summaries, and the glossary definitions and name clashes were checked only as far as stated. Nothing in any
source was tested at phone width; the pixel arithmetic is the notes' own. Tools known to the notes only from recall
(Informatica, Talend, Matillion, LabVIEW, Snowflake's semantic views, Databricks' metric views, LookML, Cube, Cognite,
SNOMED CT's release format) were left out of the argument.

### Conclusion

The survey's most useful result is a diagnosis. Nearly every documented pain in reusable pipeline units (broken paths,
silent change, frozen copies, not knowing which version ran, a schema known only by running) traces to identity by
location and to the lack of a recorded binding between a consumer and one version of what it consumes. Alteryx and
Foundry both spent 2025 and 2026 adding that binding piece by piece: version choice and Used In for macros,
version-scoped certification, immutable packages, subgraphs, version ranges for functions, validated groups of products.
smaltfl's design already assumes it, which moves the hard work elsewhere: to what goes into an interface hash, to how a
hold passes through nesting, to showing link state and run outcome on one small node, and to reviewing an update with no
server to ask who else uses it.

On this evidence smaltfl would be first in five places: a held state that passes through nested units; a node that shows
both whether its definition is current and how its last run went; a status that drills through tiers in a matrix of
days; a join's match rate kept for every run; and an ontology that travels with a component under a content hash. Being
first means there is no convention to lean on and no user study to cite, so the project's own instruments (answer keys,
the browser regression at every size, judging rounds) have to supply the evidence that the vendors' documentation
cannot. The practical order follows from that: build the pinned, by-value component with declared ports and a derived
badge first, because every part of it has a verified precedent, and treat the update flow and the nested hold as the
slices that need a decision before they need code.
