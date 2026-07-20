const fs = require('fs');

const BASE = 'd:/whole sale pharcmcy/frontend/src/components/';

function fixFile(file, replacements) {
  const fullPath = BASE + file;
  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  fs.writeFileSync(fullPath, content);
  if (content !== original) {
    console.log(`✅ ${file} - fixed`);
  } else {
    console.log(`⏭️  ${file} - no changes needed`);
  }
  return content;
}

// ─── INVENTORY.JSX ─────────────────────────────────────────────────────────────
// CRUD Modal: opens with 4 divs (overflow-y-auto, flex center, backdrop, content)
// Current end: </form> </div> </div> </div> </div> )}  <<< two </div></div> at 617-619 plus one extra
// Fix: remove the extra </div> at line 619 (was added erroneously)
fixFile('Inventory.jsx', [
  // CRUD modal closing - should be: form -> content-div -> backdrop-sibling -> flex-center -> overflow-wrapper
  // Current: </div>\n</div>\n</div>\n</div>\n)}
  // Let's ensure it has exactly the right count: 
  // form closes -> relative div closes -> flex-center div closes -> overflow-y-auto div closes
  [
    '            </form>\n          </div>\n        </div>\n        </div>\n      )}',
    '            </form>\n          </div>\n        </div>\n      )}'
  ],
  // Barcode modal closing - should end with: content-div -> flex-center -> overflow-y-auto
  // Current has stray </div> before )}
  [
    '          </div>\n        </div>\n      </div>\n      )}',
    '          </div>\n        </div>\n      )}'
  ],
]);

// ─── PURCHASES.JSX ────────────────────────────────────────────────────────────
// Payments tab closing has extra </div>  
// History tab closing has extra </div>
fixFile('Purchases.jsx', [
  // Payments tab: the tab block should close with just </div>)}
  // Check the payments tab closing - currently has extra div
  // From the logs, error is at line 392 (adjacent jsx) meaning a </div> is orphaned  
  // and line 615 (unexpected token) meaning there's an unmatched )}
  // The CREATE DOCUMENT MODAL at line 453 has:
  //   overflow-y-auto > flex-center > backdrop + relative-content
  // ends at: </form> </div> </div> </div>  )} 
  // line 614 is </div></div> which is content-div + flex-center
  // line 615 is </div>)} which is overflow-y-auto
  // That seems correct - 3 closing divs for the 3 opening divs (not counting backdrop)
  // Wait, the CREATE modal has 4 divs: overflow-y-auto, flex-center, backdrop(empty), relative-content
  // So needs 4 closing divs: content, flex-center-is-already-closed-by-children, then...
  // Actually the pattern is:
  //   <div overflow>          <- 1
  //     <div flex-center>    <- 2
  //       <div backdrop/>    <- 3 self-closing or empty
  //       <div content>      <- 4
  //         ...form...
  //       </div>             <- closes 4
  //     </div>               <- closes 2
  //   </div>                 <- closes 1
  // = 3 closing divs total 
  // 
  // Looking at lines 612-616:
  //   </form>   (inside content div)
  //   </div>    closes content div (#4)
  //   </div>    closes flex-center (#2)  - WAIT this could be the issue
  //   </div>    closes overflow-y-auto (#1)
  //   )}
  //
  // That's correct! So why the error?
  // The error was at line 392 (adjacent JSX) and line 615 (unexpected token)
  // Let me look at line 392 - that's in the "payments" tab section, not the modal
  // After my previous fixes, there may be one </div> too many somewhere.
  //
  // For now let me just ensure no extra divs in the documents tab
  ['          </div>\n          </div>\n        </div>\n      )}', '          </div>\n        </div>\n      )}'],
]);

// ─── SALES.JSX ────────────────────────────────────────────────────────────────
// POS tab (line 382-786): The grid has left+right cols
// Mobile Cart is INSIDE the POS tab (not a modal at top level)
// The POS tab ends at: </div> (end of grid) </div> )} 
// = </div> closes grid, </div> closes POS-tab-div, )} closes the conditional
fixFile('Sales.jsx', [
  // Nothing specific needed right now since build passed - just verify
]);

// ─── REPORTS.JSX ────────────────────────────────────────────────────────────
// Document viewer modal: overflow-y-auto > flex > backdrop + relative-content
// Should have 3 closing divs at end: content, flex, overflow
// Current lines 463-467: </div> </div> </div> </div> )} - that's 4
fixFile('Reports.jsx', [
  // Remove extra closing div
  ['            </div>\n          </div>\n          </div>\n        </div>\n      )}',
   '            </div>\n          </div>\n        </div>\n      )}'],
]);

// ─── CASHBOOK.JSX ────────────────────────────────────────────────────────────
// Modal: overflow-y-auto > flex-center > backdrop + relative-content
// Current lines 367-370: </div> </div> </div> )} - that's 3
// That's correct! overflow-y-auto, flex-center, and relative (backdrop is empty self-close)
// No fix needed
fixFile('CashBook.jsx', []);

// ─── EXPENSES.JSX ────────────────────────────────────────────────────────────
// Modal uses OLD pattern: flex items-center justify-center (2 divs only)
// Lines 302-304: </div> </div> )} - that's 2 = correct for 2-div structure
// No fix needed
fixFile('Expenses.jsx', []);

console.log('\n✅ All files processed.');
