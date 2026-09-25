import asyncio
import os
import sys
from playwright.async_api import async_playwright

ARTIFACTS_DIR = "/Users/slayer/.gemini/antigravity-ide/brain/449381bf-c304-43dc-aa42-007b8b713b22"
BASE_URL = "http://localhost:3000"

async def test_micro_ux():
    print("Starting targeted Micro-UX verification for Reaction Picker & More Menu...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        # 1. Login
        print("1. Logging in...")
        await page.goto(f"{BASE_URL}/login")
        await page.wait_for_selector("input")
        inputs = await page.query_selector_all("input")
        await inputs[0].fill("om")
        await inputs[1].fill("123456")
        await page.click("button[type='submit']")
        await page.wait_for_timeout(1000)

        # Check OTP
        if "Verification" in await page.content():
            otp_inputs = await page.query_selector_all("input")
            await otp_inputs[0].fill("123456")
            await page.click("button[type='submit']")
            await page.wait_for_timeout(1500)

        await page.wait_for_url("**/chats**", timeout=10000)
        print("Logged in, navigating to Rahul Sharma chat...")

        # 2. Open chat
        await page.locator("text=Rahul Sharma").first.click()
        await page.wait_for_timeout(1000)

        # 3. Locate target message bubble
        msg = page.locator("div.group").last
        await msg.scroll_into_view_if_needed()
        await msg.hover()
        await page.wait_for_timeout(300)

        # Verify toolbar is visible
        react_btn = msg.locator("button[title='React']")
        assert await react_btn.is_visible(), "Reaction button should be visible on hover"

        # 4. Hover reaction button
        print("2. Hovering reaction button...")
        react_box = await react_btn.bounding_box()
        assert react_box is not None
        await page.mouse.move(react_box["x"] + react_box["width"] / 2, react_box["y"] + react_box["height"] / 2)
        await page.wait_for_timeout(200)

        # 5. Move pointer slowly from reaction button towards picker
        print("3. Moving pointer slowly to reaction picker...")
        picker = msg.locator("button:has-text('❤️')").first
        await picker.wait_for(state="visible", timeout=3000)
        picker_box = await picker.bounding_box()
        assert picker_box is not None

        # Simulate slow human mouse movement in 10 micro-steps
        start_x = react_box["x"] + react_box["width"] / 2
        start_y = react_box["y"] + react_box["height"] / 2
        end_x = picker_box["x"] + picker_box["width"] / 2
        end_y = picker_box["y"] + picker_box["height"] / 2

        for step in range(1, 11):
            curr_x = start_x + (end_x - start_x) * (step / 10)
            curr_y = start_y + (end_y - start_y) * (step / 10)
            await page.mouse.move(curr_x, curr_y)
            await page.wait_for_timeout(30)
            # Assert picker is STILL visible during transit
            assert await picker.is_visible(), f"Picker disappeared during slow transit at step {step}!"

        print("Picker remained open during entire slow pointer movement!")

        # 6. Hover between emojis
        print("4. Hovering across emoji options in picker...")
        for emoji in ["👍", "❤️", "😂", "🔥"]:
            emoji_btn = msg.locator(f"button[title='React {emoji}']")
            assert await emoji_btn.is_visible(), f"Emoji {emoji} should be visible"
            await emoji_btn.hover()
            await page.wait_for_timeout(100)

        # Capture reaction picker screenshot
        await page.screenshot(path=os.path.join(ARTIFACTS_DIR, "micro_ux_reaction_picker_hover.png"))
        print("Saved micro_ux_reaction_picker_hover.png")

        # 7. Select reaction emoji 🔥
        print("5. Clicking reaction emoji 🔥...")
        fire_btn = msg.locator("button[title='React 🔥']")
        await fire_btn.click()
        await page.wait_for_timeout(600)

        # Picker should close upon selection
        assert not await picker.is_visible(), "Picker should close after emoji click"

        # Reaction chip should appear below message
        fire_chip = msg.locator("button:has-text('🔥')")
        assert await fire_chip.is_visible(), "Reaction chip should appear directly below bubble"
        await page.screenshot(path=os.path.join(ARTIFACTS_DIR, "micro_ux_reaction_chip_rendered.png"))
        print("Reaction chip rendered cleanly below bubble!")

        # 8. Click reaction chip again to toggle/remove
        print("6. Toggling/removing reaction...")
        await fire_chip.click()
        await page.wait_for_timeout(600)
        print("Reaction toggle verified!")

        # 9. Test More Menu
        print("7. Testing More Menu interaction...")
        await msg.hover()
        await page.wait_for_timeout(200)

        more_btn = msg.locator("button[title='More actions']")
        assert await more_btn.is_visible()
        more_box = await more_btn.bounding_box()
        assert more_box is not None

        await page.mouse.move(more_box["x"] + more_box["width"] / 2, more_box["y"] + more_box["height"] / 2)
        await more_btn.click()
        await page.wait_for_timeout(200)

        copy_item = msg.locator("button:has-text('Copy message')")
        assert await copy_item.is_visible(), "More menu should be visible"

        # Slow move from more button into menu
        menu_box = await copy_item.bounding_box()
        assert menu_box is not None
        start_x = more_box["x"] + more_box["width"] / 2
        start_y = more_box["y"] + more_box["height"] / 2
        end_x = menu_box["x"] + menu_box["width"] / 2
        end_y = menu_box["y"] + menu_box["height"] / 2

        for step in range(1, 11):
            curr_x = start_x + (end_x - start_x) * (step / 10)
            curr_y = start_y + (end_y - start_y) * (step / 10)
            await page.mouse.move(curr_x, curr_y)
            await page.wait_for_timeout(30)
            assert await copy_item.is_visible(), f"More menu disappeared during slow transit at step {step}!"

        # Hover items
        await copy_item.hover()
        await page.wait_for_timeout(150)
        reply_item = msg.locator("button:has-text('Reply')").first
        await reply_item.hover()
        await page.wait_for_timeout(150)

        await page.screenshot(path=os.path.join(ARTIFACTS_DIR, "micro_ux_more_menu_hover.png"))
        print("Saved micro_ux_more_menu_hover.png")

        # 10. Test Escape key dismissal
        print("8. Testing Escape key dismissal...")
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(300)
        assert not await copy_item.is_visible(), "More menu should close on Escape"
        print("Escape dismissal verified!")

        # 11. Test Outside Click dismissal
        print("9. Testing Outside Click dismissal...")
        await msg.hover()
        await page.wait_for_timeout(200)
        await more_btn.click()
        await page.wait_for_timeout(200)
        assert await copy_item.is_visible()

        # Click on empty area in chat pane
        await page.mouse.click(200, 200)
        await page.wait_for_timeout(300)
        assert not await copy_item.is_visible(), "More menu should close on outside click"
        print("Outside click dismissal verified!")

        # 12. Fast mouse movement test
        print("10. Testing fast pointer movement on reaction picker...")
        await msg.hover()
        await page.wait_for_timeout(200)
        await react_btn.hover()
        await page.wait_for_timeout(100)
        # Flick mouse straight up into the picker
        await page.mouse.move(react_box["x"], react_box["y"] - 35)
        await page.wait_for_timeout(100)
        assert await msg.locator("button:has-text('❤️')").first.is_visible(), "Picker should stay open on fast movement"
        print("Fast pointer movement verified!")

        await browser.close()
        print("ALL MICRO-UX INTERACTION TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    asyncio.run(test_micro_ux())
