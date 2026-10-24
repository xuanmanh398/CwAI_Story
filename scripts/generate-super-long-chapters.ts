import { SEED_50_NOVELS, SeedNovel } from '../server/data/seed-novels';
import * as fs from 'fs';
import * as path from 'path';

function createSuperLongChapterV2(
  novel: SeedNovel,
  chapterNum: number,
  chapterTitle: string
): string {
  const g = novel.genreSlug;
  const t = novel.title;
  const a = novel.author;

  const sections: string[] = [];

  if (g === 'tien-hiep') {
    sections.push(
      `Đêm đông buốt giá phủ trùm lên rặng núi Cửu Long, tuyết rơi dày đặc tựa như những mảnh lông ngỗng chao đảo giữa không trung mù mịt. Từng cơn gió lạnh buốt từ phương bắc thốc qua các khe núi dựng đứng, rít lên những hồi ai oán tựa hồ như tiếng kêu than của vô vàn vong linh viễn cổ bị giam cầm nơi hàn băng lãnh ngục. Giữa khung cảnh tiêu điều hoang vắng nghìn thước tuyết trắng ấy, trên một mỏm đá nhô ra giữa vực sâu vạn trượng, một bóng hình đơn bạc đang ngồi xếp bằng tĩnh tọa.

Mái tóc dài đen nhánh phủ đầy sương tuyết, vạt áo bào màu xám tro rách rưới bay phần phật trong gió bão. Đó chính là thiếu niên mang trong mình phàm căn phế mạch, kẻ mà suốt mười tám năm qua bị coi là phế vật tận cùng của giới tu chân, chịu đủ mọi sự lăng nhục, khinh miệt của thế nhân. Nhưng giờ phút này, khuôn mặt gầy guộc của hắn lại toát lên một vẻ kiên định đến mức đáng sợ. Đôi bờ môi nứt nẻ vì lạnh khẽ mím chặt, hai bàn tay đan kết thành ấn quyết "Quy Nguyên Phục Ma", từng luồng hơi thở trắng xóa thở ra hòa tan vào không khí lạnh ngắt.

Dưới chân vách đá là vực thẳm Vạn Trượng Hắc Uyên, nơi tương truyền từng chôn vùi một tôn Thần Ma thời thượng cổ. Tương truyền rằng cứ mỗi dịp trăng tròn mùa đông, kết giới phong ấn lại xuất hiện một khe hở nhỏ, giải phóng ra những luồng Hỗn Độn Sát Khí có thể ăn mòn cả kim thạch. Người bình thường chỉ cần hít phải một ngụm nhỏ cũng đủ để đứt đoạn tâm mạch mà chết bất đắc kỳ tử. Nhưng đối với hắn, đây lại là hy vọng duy nhất để đập vỡ xiềng xích phế mạch đã giam hãm cuộc đời mình bấy lâu nay.`
    );

    sections.push(
      `Trong cơ thể hắn lúc này, cục diện lại hoàn toàn trái ngược với vẻ tĩnh lặng bên ngoài. Khí hải đan điền giờ đây tựa như một vùng biển lửa cuộn sóng ngút trời. Những sợi linh khí màu tử kim mỏng manh như sợi tơ tằm nhưng nặng tựa ngàn cân đang bắt đầu chuyển động, men theo các đường kinh mạch bế tắc suốt gần hai mươi năm qua mà dũng mãnh đâm xuyên.

Cơn đau đớn xé rách tâm can ập đến như vạn tiễn xuyên tâm! Từng tấc kinh mạch, từng khúc xương tủy dường như bị một chiếc búa tạ nghìn cân đập nát vụn ra rồi tái tạo lại. Mồ hôi lạnh túa ra như tắm, chưa kịp rơi xuống đã bị giá rét đóng băng thành những hạt tuyết li ti trên gò má. Nhưng thiếu niên không hề kêu rên lấy nửa lời, bởi vì hắn hiểu rất rõ, phàm nhân muốn nghịch thiên cải mệnh, nếu không chịu nổi nỗi thống khổ này thì vĩnh viễn chỉ là con sâu cái kiến dưới chân những bậc đại năng tu tiên mà thôi.

— "Tu chân giả, thuận theo trời là phàm nhân, nghịch lại trời mới thành tiên! Nếu thiên đạo đã định ta sinh ra là cỏ rác, ta liền dùng chính ý chí sắt đá này để chém nát thiên đạo!" — Một tiếng gầm trầm đục vang vọng trong sâu thẳm thức hải, chấn động đến mức hồn phách run rẩy.

Ký ức của mười năm trước lại hiện về rõ nét như vừa mới xảy ra ngày hôm qua. Ngày đại khảo hạch gia tộc năm ấy, tấm Thạch Bi Giám Định tu vi phát ra ánh sáng xám xịt của phàm căn hạ phẩm, tiếng cười nhạo mỉa mai của trưởng lão, ánh mắt thất vọng cùng cực của phụ thân, và nụ cười độc địa của người đệ đệ cùng cha khác mẹ... Tất cả những nỗi nhục nhã ê chề ấy đã đúc kết nên một trái tim sắt đá không biết lùi bước.`
    );

    sections.push(
      `Bỗng nhiên, từ sâu trong khu rừng trúc cổ thụ phía sau lưng vang lên tiếng sột soạt gấp gáp của cành lá bị giẫm gãy. Tiếp theo đó là tiếng cười khẩy the thé đầy vẻ mỉa mai, xé tan màn đêm tĩnh mịch:

— "Ha ha ha! Ta tưởng là con thú hoang nào lén lút trốn ở đây độ kiếp, hóa ra lại là tên phế vật ngươi! Đêm hôm khuya khoắt một mình chạy lên Đoạn Hồn Nhai này, chẳng lẽ muốn nhảy vực tự vẫn vì xấu hổ sao?"

Ánh kiếm quang lóe lên, soi rõ ba bóng người vận đạo bào màu lam nhạt của đệ tử nội môn phái Thanh Vân. Kẻ dẫn đầu là một thanh niên trạc hai mươi lăm tuổi, khuôn mặt tuấn tú nhưng ánh mắt lại ngập tràn vẻ kiêu căng, ngạo mạn. Hắn chính là Triệu Lăng Phong, thiên tài ngoại môn vừa mới đột phá Luyện Khí tầng thứ bảy, cũng là kẻ từng công khai sỉ nhục thiếu niên trước mặt hàng ngàn đệ tử trong ngày đại hội tông môn.

Đi sau hắn là hai tên đệ tử nịnh hót, tay lăm lăm đoản kiếm, ánh mắt nhìn thiếu niên chẳng khác nào nhìn một con mồi đã nằm gọn trong tay lưới.

— "Triệu sư huynh, cần gì phải nói nhiều lời với tên rác rưởi này? Các chủ từng ngầm căn dặn, kẻ này trên người có mang bí mật của gia tộc cổ xưa, chỉ cần phế bỏ tu vi của hắn rồi ép hỏi ra lai lịch tấm ngọc bội thượng cổ, chúng ta ắt sẽ được trọng thưởng một bình Trúc Cơ Đan!" — Tên đệ tử bên trái liếm môi, sát khí lộ rõ trên gương mặt.

— "Đúng vậy sư huynh! Đoạn Hồn Nhai này hoang vu hẻo lánh, có giết chết hắn rồi ném xuống vực sâu cho linh thú ăn thịt thì ngoài kia cũng chẳng ai hay biết. Một tên phế nhân chết đi, tông môn lại bớt đi một miệng ăn vô dụng!" — Tên đệ tử bên phải phụ họa theo, lưỡi kiếm rút khỏi vỏ kêu một tiếng 'keng' lạnh lẽo.`
    );

    sections.push(
      `Thiếu niên vẫn ngồi bất động, đôi mắt từ từ mở ra. Trong con ngươi đen thẳm bỗng nhiên xẹt qua một tia sấm sét màu lam tím sắc bén đến rợn người, khiến cho Triệu Lăng Phong đang nghênh ngang bước tới bỗng nhiên cảm thấy sống lưng lạnh toát, bước chân bất giác dừng khựng lại nửa nhịp.

— "Bí mật ngọc bội? Các ngươi muốn nó sao?" — Thiếu niên chậm rãi đứng dậy, giọng nói trầm tĩnh đến lạ kỳ, không hề có một chút sợ hãi hay hoảng loạn nào như bọn chúng từng tưởng tượng.

— "Ngươi... ngươi dám dùng ánh mắt đó nhìn ta?" — Triệu Lăng Phong tức giận vì cảm giác sợ hãi vô cớ vừa thoáng qua trong lòng. Hắn gầm lên một tiếng, chân khí Luyện Khí tầng bảy bộc phát cuồng bạo, bàn tay phải biến thành móng vuốt mang theo kình phong xé gió lao thẳng tới yết hầu của thiếu niên: — "Hôm nay ta sẽ cho ngươi biết, ranh giới giữa thiên tài và phế vật là khoảng cách mà cả đời ngươi cũng không thể vượt qua!"

"Huyền Phong Trảo!" — Kình phong gào thét cuộn tung lớp tuyết dày ba thước, năm đạo móng vuốt bằng chân khí sắc nhọn tựa như lưỡi dao thép chém rách không gian hướng thẳng tới điểm chí mạng. Đây là hoàng giai trung phẩm công pháp mà Triệu Lăng Phong đã khổ luyện suốt ba năm, một trảo này đánh ra đủ để bẻ gãy một thân cây cổ thụ hai người ôm!`
    );

    sections.push(
      `Đối diện với đòn tấn công sấm sét ấy, thiếu niên không hề né tránh. Hắn khẽ hít sâu một hơi, chân khí tử kim vừa mới khai thông trong đan điền lập tức dâng trào như núi lửa phun trào. Cánh tay phải chấn động mạnh mẽ, nắm đấm thép vung ra nghênh đón trực diện!

"Oanh!" — Một tiếng nổ kinh thiên vang lên giữa đêm tuyết!

Kình lực va chạm tạo thành một làn sóng xung kích hình tròn thổi bạt cả ba gã đệ tử nội môn. Tiếng xương gãy rắc rắc giòn giã vang lên trong đêm tối, kéo theo tiếng thét thảm thiết kinh hoàng của Triệu Lăng Phong. Toàn bộ năm ngón tay của hắn vặn vẹo biến dạng, thân thể như một bao cát rách bay ngược ra sau hơn mười trượng, đập mạnh vào vách đá hoa cương nôn ra một búng máu tươi đỏ thẫm.

— "Làm... làm sao có thể?! Khí tức này... đây rõ ràng là sức mạnh thể phách của Luyện Thể Cực Cảnh! Ngươi rõ ràng là một kẻ phế nhân, sao có thể nắm giữ thần lực bực này?!" — Hai tên đệ tử đi cùng mặt mày tái mét, run rẩy lùi lại phía sau, vũ khí trên tay suýt chút nữa rơi xuống đất.

Chúng không thể nào tin nổi vào mắt mình. Một kẻ ngay cả một sợi chân khí cũng không thể ngưng tụ, giờ đây chỉ bằng một quyền thuần túy về lực đạo đã đánh gãy tay của một tu sĩ Luyện Khí tầng bảy!`
    );

    sections.push(
      `Thiếu niên chậm rãi bước tới từng bước, mỗi bước chân giẫm lên nền tuyết đều để lại một dấu chân cháy xém phát ra làn khói màu tím mờ ảo. Đó chính là uy áp của công pháp chí tôn viễn cổ đang thức tỉnh trong cơ thể hắn.

— "Trên đời này không có phế vật, chỉ có những kẻ tự mãn ngu xuẩn ỷ thế hiếp người như các ngươi mà thôi. Mười năm chịu đựng nhục nhã, mối thù này hôm nay bắt đầu thanh toán từng người một!" — Giọng nói lạnh lùng vang vọng như lời phán quyết của tử thần.

Chỉ thấy bóng hình hắn mờ đi trong chớp mắt, thân pháp quỷ dị tựa như làn khói mỏng. Trước khi hai tên đệ tử kịp nhận thức chuyện gì đang xảy ra, hai đạo kiếm chỉ mang theo lôi đình dĩ vãng đã điểm thẳng vào đan điền của bọn chúng. Hai tiếng "bụp" trầm đục vang lên, toàn bộ khí hải tích lũy bao năm tu hành của hai kẻ ác độc trong nháy mắt tan biến thành hư vô!

Hai tên đệ tử ngã quỵ xuống đất, ôm bụng quằn quại gào khóc trong tuyệt vọng tột cùng: — "Tu vi của ta... đan điền của ta bị phế rồi! Ác ma... ngươi là ác ma phương nào tái sinh!"

Triệu Lăng Phong tựa lưng vào vách đá nôn ra từng ngụm máu bầm, đôi mắt tràn ngập sự kinh hoàng và hối hận tột cùng khi nhìn bóng hình thiếu niên từng bước tiến lại gần. Hắn run rẩy thò tay vào trong ngực áo, lấy ra một chiếc lệnh tiễn truyền tin bằng ngọc đỏ, toan bóp nát để cầu cứu phụ thân là đại trưởng lão tông môn.

Thế nhưng, tốc độ của thiếu niên còn nhanh hơn sấm chớp. Mũi chân hắn khẽ hất lên, thanh trường kiếm rơi trên mặt đất bay vút tới, chuẩn xác ghim chặt bàn tay cầm lệnh tiễn của Triệu Lăng Phong vào vách đá cứng ngắc.`
    );

    sections.push(
      `— "A a a! Xin tha mạng... xin sư đệ hạ thủ lưu tình! Năm xưa là phụ thân ta ép buộc ta hãm hại ngươi, ta... ta cũng chỉ là kẻ thừa lệnh mà thôi! Chỉ cần ngươi tha cho ta một con đường sống, toàn bộ linh thạch, đan dược và công pháp bí truyền ta đều dâng tặng cho ngươi!" — Kẻ từng kiêu hãnh ngút trời giờ đây quỳ rạp dưới chân kẻ thù, nước mắt nước mũi đầm đìa van xin như một con chó hoang cùng đường.

Thiếu niên dừng bước, cúi đầu nhìn kẻ thù bại trận bằng ánh mắt lạnh tanh không một gợn sóng:

— "Gieo nhân nào ắt gặt quả nấy. Khi các ngươi ra tay bức hại mẫu thân ta, khi các ngươi dồn ép phụ thân ta vào đường cùng, có từng nghĩ đến hai chữ tha mạng hay không?"

Gió tuyết càng lúc càng dữ dội, thổi tung mái tóc dài của người tu đạo. Một đạo kiếm phong sắc bén lướt qua trong đêm tối, dứt khoát chấm dứt chuỗi ngày gieo rắc tai ương của kẻ thủ ác. Máu tươi bắn tung tóe lên vách đá trắng xóa, rồi nhanh chóng bị làn tuyết phủ lấp đi.`
    );

    sections.push(
      `Sau khi thu dọn túi trữ vật của ba tên bại trận, thiếu niên quay trở lại mỏm đá bên bờ vực. Hắn ngồi xếp bằng xuống, lấy từ trong ngực áo ra tấm ngọc bội gia truyền hình rồng uốn lượn. Lúc này, sau khi hấp thụ trọn vẹn luồng linh khí hỗn độn từ đáy vực sâu, bề mặt ngọc bội đã xuất hiện những hoa văn kim sắc rực rỡ, tỏa ra hơi ấm dịu dàng xua tan đi cái lạnh thấu xương của đỉnh núi mùa đông.

Trong tâm thức hắn, một giọng nói cổ xưa, trầm hùng vang vọng như từ thời hồng hoang viễn cổ vọng về:

— "Hỡi hậu nhân của dòng máu Thần Long, ngươi đã thông qua khảo nghiệm đầu tiên của Đạo Tâm. Nhớ kỹ, con đường tu tiên là con đường cô độc, một bước đạp lên máu tanh của vạn giới. Hãy giữ vững bản tâm, không vì quyền lực mà mê muội, không vì sát lục mà đánh mất nhân tính."

Từng dòng khẩu quyết tu luyện huyền diệu của bộ công pháp "Thần Long Cửu Biến" bắt đầu in sâu vào linh hồn hắn: Biến thứ nhất — Long Cốt Hoán Huyết; Biến thứ hai — Long Lân Thiết Giáp; Biến thứ ba — Long Tức Phá Hư... Mỗi một biến đều là cảnh giới chí tôn mà các bậc đại năng đương thời nằm mơ cũng không thể chạm tới.

Thiếu niên hít sâu một hơi dài, cảm nhận luồng chân khí cuồn cuộn như thác lũ đang chảy xuôi trong huyết quản. Hắn từ từ đứng dậy, phóng tầm mắt nhìn qua biển mây nghìn trùng về phía đại lục Cửu Châu xa xôi nơi có muôn ngàn tông môn thế gia đang xưng hùng xưng bá.

Một nụ cười ngạo nghễ thoáng hiện trên môi. Hành trình đạp bằng chư thiên, đăng lâm tuyệt đỉnh của ${t} từ giây phút này chính thức bước vào chương mở màn oanh liệt nhất!`
    );
  } else if (g === 'kiem-hiep') {
    sections.push(
      `Màn hoàng hôn buông xuống trên dòng Lạc Thủy đỏ thẫm như máu, nhuộm cả một vùng trời tây thành một dải lụa thêu dở dang vắt ngang những rặng núi điệp trùng. Gió thu se lạnh cuốn theo những chiếc lá phong úa tàn xoay tít trên mặt đường đá sỏi gập ghềnh, rít lên từng tràng qua rặng liễu xơ xác bên bờ sông. Nơi ngã ba đường dẫn vào cổ trấn, ngôi tửu quán tranh vách đất ọp ẹp đứng chơ vơ giữa cảnh chiều tà tĩnh mịch, tấm biển hiệu bạt rách mang ba chữ "Vọng Giang Lâu" đung đưa cót két theo từng cơn gió thoảng.

Bên trong quán, không khí ngột ngạt đến nghẹt thở. Mười mấy vị khách giang hồ mang đao đeo kiếm ngồi rải rác ở các góc bàn, nhưng không một ai cất tiếng cười đùa hay gọi rượu. Tất cả ánh mắt sắc lạnh, cảnh giác đều đồng loạt dồn về phía chiếc bàn con kê sát góc cửa sổ nhìn ra bến sông.

Nơi đó, một thanh niên vận thanh y thô sơ đang chậm rãi dùng một mảnh vải cũ lau chùi thanh kiếm bọc da trâu sờn rách. Chiếc nón trúc sụp xuống che khuất nửa khuôn mặt phong trần sương gió, chỉ để lộ đường quai hàm cương nghị và đôi môi mím chặt. Đĩa thịt bò luộc trên bàn chỉ mới vơi một nửa, vò Nữ Nhi Hồng hai mươi năm ủ kỹ vẫn còn tỏa hương thơm nồng nàn cay dịu trong không gian tịch mịch.`
    );

    sections.push(
      `Mười năm trước, cũng trong một buổi chiều thu lạnh lẽo thế này, thảm án Nhạn Đãng Sơn đã khiến danh môn chính phái Bắc Đao Môn tan thành tro bụi chỉ sau một đêm mưa bão. Hơn ba trăm nhân mạng của dòng họ Tiêu bị tàn sát không tha một ai, chỉ duy nhất một đứa trẻ mười tuổi được trung bộc liều mạng cõng trốn qua đường hầm bí mật dưới đáy giếng cổ.

Mười năm nếm mật nằm gai, luyện kiếm nơi thâm sơn cùng cốc ngàn trượng thác đổ, thanh kiếm trên tay hắn đã không biết uống bao nhiêu máu của loài lang sói hung tợn. Từng đường kiếm vung ra không chỉ mang theo kình lực của nội gia chính tông mà còn chất chứa nỗi căm hờn ngút trời của một huyết hải thâm thù không đội trời chung.

— "Tiểu nhị, tính tiền!" — Giọng nói trầm thấp vang lên, phá vỡ bầu không khí im lặng kéo dài suốt nửa canh giờ qua.

Lão chủ quán già run rẩy từ sau quầy bước ra, hai tay bưng đĩa hạt dưa bước đi không vững: — "Khách... khách quan, tổng cộng là hai lượng bạc vụn. Trời sắp tối rồi, quan đạo phía trước hoang vắng nhiều trộm cướp dữ tợn, khách quan chi bằng ở lại điếm này nghỉ tạm một đêm..."`
    );

    sections.push(
      `Chưa kịp dứt lời, một tiếng nổ chát chúa vang lên làm vỡ toang cánh cửa gỗ của tửu quán! Bụi đất mù mịt bay tung tóe, kèm theo đó là luồng kình phong cuồng bạo thổi tắt ngọn đèn dầu leo lắt trên vách tường. Bảy bóng đen bịt mặt mang theo đao thương sắc nhọn phi thân ùa vào, vây kín toàn bộ lối ra vào của ngôi quán.

Kẻ dẫn đầu vóc dáng cao lớn như hộ pháp, trên tay cầm thanh bát giác quỷ đầu đao nặng hơn bốn mươi cân, lưỡi đao tỏa ra tử khí tanh tưởi do tẩm kịch độc thất bộ đoạn hồn. Hắn đảo mắt một vòng quanh quán rồi dừng lại nơi chiếc bàn góc cửa sổ, cất tiếng cười ồ ồ như chuông vỡ:

— "Ha ha ha! Khá cho một tên dư nghiệt Tiêu gia! Trốn chui trốn lủi suốt mười năm nay, hôm nay rốt cuộc cũng chịu mò mặt xuất đầu lộ diện! Ngươi nghĩ rằng đổi tên họ, khoác lên bộ áo vải thô này là có thể qua mắt được thiên la địa võng của Thiết Huyết Minh hay sao?"

Những vị khách trong quán sợ hãi ríu rít dạt sang hai bên, không ít kẻ nhận ra thân phận của bảy tên sát thủ khét tiếng: — "Đó là 'Thất Sát Lãnh Huyết' của bang Thiết Huyết! Kẻ cầm đầu là Lãnh Diện Diêm La Chu Báo, võ công đã đạt tới cảnh giới Nhất Lưu Cao Thủ, đao pháp tàn độc khét tiếng giang hồ!"`
    );

    sections.push(
      `Thanh niên thanh y vẫn bình thản đặt một nén bạc nén xuống mặt bàn gỗ, thong thả đứng dậy tra kiếm vào vỏ. Ánh mắt hắn nhìn qua lớp nón trúc chiếu thẳng vào Chu Báo, trầm tĩnh tựa như mặt nước hồ thu không một gợn sóng:

— "Chu Báo, mười năm trước ngươi bất quá chỉ là một tên mã phu giữ ngựa trong Tiêu phủ. Cha ta có ơn cứu mạng cả nhà ngươi, cớ sao lại cam tâm làm chó săn cho kẻ thù, hạ độc vào giếng nước giết hại đồng môn?"

Nghe nhắc đến chuyện cũ, sắc mặt Chu Báo bỗng chốc trở nên vặn vẹo dữ tợn. Hắn gầm lên một tiếng đầy thẹn quá hóa giận:

— "Câm mồm! Lương thiện có ăn được không? Trung nghĩa có đổi lấy được hoàng kim vạn lượng và quyền uy thống lĩnh võ lâm không?! Cha ngươi quá mức cổ hủ, giữ khư khư pho bí kíp kiếm phổ thượng thừa không chịu chia sẻ, chết là đáng đời! Hôm nay nếu ngươi ngoan ngoãn giao nộp nửa cuốn kiếm phổ còn lại, Chu mỗ nể tình nghĩa xưa sẽ chôn cất ngươi tử tế, bằng không ta sẽ băm vây chặt khúc ngươi ra cho cá dưới sông Lạc Thủy ăn!"`
    );

    sections.push(
      `— "Kiếm phổ ở ngay trên người ta, chỉ e ngươi không đủ bản lĩnh để lấy!" — Thanh niên khẽ thở dài, tay phải nhẹ nhàng đặt lên chuôi kiếm.

— "Rượu mời không uống lại thích uống rượu phạt! Các huynh đệ, lập trận 'Thất Tinh Đoạt Mệnh', băm vằn hắn cho ta!" — Chu Báo gầm lên, vung thanh quỷ đầu đao chém ra một luồng đao phong cuồng bạo xé rách không khí, mang theo tiếng gào thét của quỷ dữ bổ thẳng xuống đầu thanh niên.

Cùng lúc đó, sáu tên sát thủ còn lại đồng loạt rút đao kiếm xông lên từ sáu phương hướng hiểm hóc, khóa chặt toàn bộ đường lui của đối thủ. Không gian nhỏ hẹp của quán rượu trong chớp mắt ngập tràn sát khí bức người, bụi rơm và bàn ghế bị kình phong chém nát vụn bay tứ tung.

Thời khắc nghìn cân treo sợi tóc ấy, thanh niên bỗng nhiên động!

"Keng!" — Một tiếng ngân thanh thúy vang lên tựa như tiếng phượng hoàng hót trên chín tầng mây xanh, xé tan toàn bộ đao quang kiếm ảnh hỗn loạn. Thanh trường kiếm rời vỏ trong nháy mắt, một đạo kiếm quang màu lam thuần khiết bừng sáng rực rỡ, chiếu rọi khuôn mặt đầy kinh ngạc của bảy tên sát thủ.`
    );

    sections.push(
      `"Cô Nhạn Xuất Sơn!" — Chiêu thứ nhất trong mười ba đường kiếm tuyệt kỹ gia truyền tái hiện giang hồ!

Thân pháp của thanh niên lướt đi phiêu dật tựa như một cánh chim nhạn lẻ loi chao liệng giữa cơn bão táp. Kiếm phong đi tới đâu, đao thương của lũ hung đồ chạm vào đều vỡ vụn thành từng mảnh thép vụn rớt lộp độp xuống đất. Chưa đầy ba hơi thở, tiếng kiếm reo im bặt.

Cả quán rượu rơi vào sự tĩnh lặng chết chóc. Sáu tên sát thủ vẫn đứng bất động ở tư thế vung đao, nhưng đôi mắt của bọn chúng đã trợn trừng vô hồn. Trên cổ họng mỗi tên, một vệt tơ máu mỏng manh từ từ rỉ ra rồi đồng loạt ngã gục xuống sàn nhà, không kịp rên rỉ lấy một tiếng.

Chỉ còn lại một mình Chu Báo đứng chôn chân tại chỗ, thanh quỷ đầu đao trên tay gãy lìa chỉ còn trơ lại phần chuôi đao đẫm máu. Mồ hôi lạnh chảy dài ướt đẫm lưng áo, hắn run rẩy nhìn vết cắt ngọt xớt nơi cổ tay áo của mình:

— "Đây... đây không phải là Kiếm phổ thông thường! Đây là... Đăng Phong Tạo Cực, Kiếm Ý Đại Thành! Ngươi... ngươi đã bước vào cảnh giới Tông Sư từ bao giờ?!"`
    );

    sections.push(
      `Thanh niên từ từ hạ lưỡi kiếm xuống, đầu mũi kiếm chỉ cách yết hầu của kẻ phản bội đúng nửa tấc. Ánh mắt hắn nhìn Chu Báo lạnh lẽo như băng tuyết ngàn năm:

— "Ngươi không xứng chết dưới thanh kiếm này của cha ta. Hãy mang thông điệp này về cho tên Các chủ của Thiết Huyết Minh: Mối thù mười năm ở Nhạn Đãng Sơn, từng món nợ máu, Tiêu mỗ này sẽ đích thân bước tới tổng đà đòi lại từng phân từng tấc!"

Nói đoạn, hắn khẽ vung tay áo, một luồng kình phong cách không đánh thẳng vào huyệt đạo đan điền của Chu Báo. Tên phản đồ phun ra một ngụm máu đen ngã nhào ra ngoài cửa sổ, toàn bộ võ công tu luyện ba mươi năm qua hoàn toàn bị phế bỏ.

Thanh niên thu kiếm vào vỏ, chỉnh lại vành nón trúc rồi bước ra khỏi quán rượu. Bên ngoài, màn đêm đã buông xuống đen đặc như mực, chỉ có vầng trăng thượng huyền lấp lánh soi sáng con đường độc hành phía trước. Hành trình trừ gian diệt ác, lập lại trật tự võ lâm của ${t} từ nay chính thức bước vào những trận chiến kinh thiên động địa nhất...`
    );
  } else if (g === 'do-thi') {
    sections.push(
      `Ánh đèn đường màu vàng ấm áp hắt hiu rọi xuống những con hẻm nhỏ ngoằn ngoèo còn đọng đầy nước mưa sau cơn dông bất chợt của thành phố. Tiếng còi xe hối hả, tiếng rao hàng đêm muộn hòa cùng nhịp sống cuồn cuộn không ngừng nghỉ của đô thị phồn hoa bậc nhất phương Nam. Trên tầng ba mươi sáu của tòa nhà văn phòng trung tâm quận Một, ánh đèn từ một căn phòng làm việc góc vẫn sáng rực rỡ giữa bầu trời đêm.

Ngồi trước ba chiếc màn hình máy tính hiển thị chi chít những biểu đồ tài chính, mã chứng khoán và dữ liệu y khoa lâm sàng, một người đàn ông ngoài ba mươi tuổi đang chăm chú ghi chép vào cuốn sổ tay bìa da đã sờn mép. Gương mặt anh phảng phất nét mệt mỏi sau hơn mười sáu tiếng làm việc liên tục, nhưng trong ánh mắt lại rực cháy một ngọn lửa nhiệt huyết không bao giờ lụi tàn.

Mười năm trước, tốt nghiệp thủ khoa trường Đại học Y Dược danh giá nhưng không có ô dù nâng đỡ, anh từng phải nếm trải đủ mọi cay đắng bất công của chốn công sở y tế. Những đêm trực trắng mắt nơi phòng cấp cứu nghèo nàn, những ca phẫu thuật cứu người thành công nhưng công trạng đều bị kẻ có quyền thế cướp trắng, thậm chí còn bị vu oan giá họa suýt chút nữa tước đi chứng chỉ hành nghề cứu người.`
    );

    sections.push(
      `— "Muốn thay đổi được hiện thực tàn khốc, chỉ có lòng tốt thôi là chưa đủ. Mình phải trở nên đủ mạnh, đủ quyền lực và đủ nguồn lực tài chính để bảo vệ những sinh mệnh bé nhỏ không nơi nương tựa!" — Lời thề son sắt khắc ghi trong đêm mưa năm ấy nơi chân cầu Sài Gòn đã trở thành động lực to lớn đưa anh rẽ sang một con đường chông gai: vừa nâng cao tay nghề y khoa xuất chúng, vừa dấn thân vào thương trường công nghệ sinh học đầy cạm bẫy.

Bỗng nhiên, tiếng chuông điện thoại đường dây nóng bảo mật reo vang từng hồi dồn dập. Nhìn thấy dãy số hiển thị mã vùng quốc tế đặc biệt, ánh mắt anh lập tức ngưng tụ thành một sự tập trung cao độ.

— "Alo, tôi là bác sĩ Minh Quân nghe."

Đầu dây bên kia truyền đến giọng nói nghẹn ngào, hoảng loạn của Viện trưởng Bệnh viện Nhi Đồng: — "Minh Quân! Cậu mau đến ngay phòng mổ số một! Vừa có một chuyến bay cấp cứu đặc biệt đưa bé gái bảy tuổi bị đa chấn thương và suy tim cấp do tai nạn sạt lở đất ở vùng cao về. Cả kíp mổ hàng đầu thành phố đã hội chẩn nhưng quả tim của cháu bé đã ngừng đập hai lần, các chỉ số sinh tồn đang tụt dốc thê thảm! Viện trưởng các bệnh viện lớn đều lắc đầu, hiện tại chỉ có phương pháp vi phẫu ghép mạch máu nhân tạo do cậu sáng chế mới có hy vọng cứu vớt sinh linh nhỏ bé này!"`
    );

    sections.push(
      `Không một giây chần chừ, Minh Quân dập máy, với lấy chiếc áo khoác gió lao nhanh ra thang máy chuyên dụng. Chiếc xe thể thao gầm rú lao vút vào màn mưa đêm, vượt qua những cung đường kẹt cứng với tốc độ tối đa, tiếng còi hú khẩn cấp xé toạc màn sương mù ẩm ướt của thành phố.

Mười lăm phút sau, tại hành lang khu phẫu thuật đặc biệt của Bệnh viện Nhi Đồng, bầu không khí nặng nề bao trùm tựa như muốn bóp nghẹt trái tim của mọi người. Người mẹ nghèo dân tộc thiểu số mặc bộ đồ chàm rách rưới quỳ sụp dưới sàn nhà lạnh ngắt, hai bàn tay chắp chặt trước ngực khóc không ra tiếng, đôi mắt đờ đẫn tuyệt vọng nhìn vào cánh cửa phòng mổ đóng chặt.

Xung quanh, hàng chục giáo sư, bác sĩ đầu ngành đang đứng thở dài bất lực:

— "Tổn thương cơ tim quá nặng, động mạch chủ bị rách một đoạn dài ba phân, máu tràn khoang màng tim dữ dội. Trong điều kiện tim ngừng đập kéo dài thế này, can thiệp phẫu thuật hở gần như cầm chắc thất bại trên bàn mổ..."`
    );

    sections.push(
      `Đúng lúc đó, cánh cửa tự động bật mở, bóng dáng cao ráo của Minh Quân xuất hiện. Anh nhanh chóng bước vào phòng khử trùng, vừa rửa tay vừa lắng nghe tóm tắt hồ sơ bệnh án với tốc độ siêu phàm:

— "Chuẩn bị máy tuần hoàn ngoài cơ thể ECMO thế hệ mới! Lấy ngay ống ghép mạch máu vật liệu sinh học nano trong va ly y tế cá nhân của tôi ra! Thiết lập kính hiển vi phẫu thuật độ phóng đại ba mươi lần, bơm dung dịch bảo vệ cơ tim nhiệt độ bốn độ C!" — Từng mệnh lệnh đanh thép, chuẩn xác vang lên khiến toàn bộ kíp mổ đang hoang mang lập tức lấy lại được nhịp điệu phối hợp nhịp nhàng.

Bước vào bàn mổ dưới ánh đèn huỳnh quang chói lòa, Minh Quân nhìn thấy lồng ngực nhỏ bé của bệnh nhi đang hé mở, quả tim non nớt yếu ớt thoi thóp từng nhịp rời rạc.

— "Bác sĩ Minh Quân, chỉ số SpO2 tụt xuống dưới 60%, huyết áp 40/20, máy theo dõi rung thất bắt đầu phát tín hiệu đường thẳng!" — Y tá gây mê hồi sức hô to trong lo lắng tột độ.`
    );

    sections.push(
      `— "Sốc điện giải rung hai mươi Jun lần một! Bắt đầu vi phẫu khâu nối động mạch chủ!" — Đôi bàn tay của Minh Quân nắm lấy chiếc kẹp vi phẫu và sợi chỉ phẫu thuật mảnh hơn sợi tóc một cách vững chãi lạ thường.

Dưới lăng kính hiển vi phóng đại tối đa, từng đường kim mũi chỉ của anh di chuyển thoăn thoắt với tốc độ và sự chuẩn xác tuyệt đối tựa như một nghệ nhân điêu khắc bậc thầy. Không một động tác thừa, không một tia run rẩy nơi đầu ngón tay. Trong tâm trí anh giờ đây không còn danh vọng, không còn sự mệt mỏi của ngày dài, mà chỉ có một tâm niệm duy nhất: giành giật sự sống của đứa trẻ này từ tay thần chết!

Từng mũi khâu vi mạch tinh xảo được khóa lại, ống ghép nano sinh học hoàn toàn tương thích với cơ thể non nớt. Mười phút trôi qua nghẹt thở như mười thế kỷ...

"Bíp... bíp... bíp..." — Tiếng chuông nhịp tim trên máy monitor bỗng nhiên vang lên đều đặn trở lại!

— "Huyết áp tăng lên 90/60! SpO2 hồi phục 98%! Trái tim của cháu bé đã tự đập lại bình thường mà không cần trợ tim nữa rồi!" — Tiếng reo hò vỡ òa trong hạnh phúc của toàn bộ y bác sĩ trong phòng mổ phá tan mọi âu lo căng thẳng.`
    );

    sections.push(
      `Minh Quân bước ra khỏi phòng mổ sau bốn tiếng đồng hồ căng thẳng tột độ. Tháo chiếc khẩu trang đẫm mồ hôi, anh bước tới trước mặt người mẹ nghèo đang run rẩy ngẩng đầu nhìn lên.

— "Cháu bé đã qua cơn nguy kịch rồi chị à. Quả tim của cháu đã hồi sinh khỏe mạnh, ngày mai là có thể chuyển về phòng chăm sóc đặc biệt." — Anh mỉm cười hiền hậu, đưa tay đỡ người mẹ đứng dậy.

Người mẹ nghèo ôm chặt lấy đôi bàn tay cứu mạng của anh, những giọt nước mắt biết ơn lăn dài trên đôi má đen sạm vì sương gió: — "Bác sĩ ơi... ơn cứu mạng này gia đình tôi ngàn đời không bao giờ quên được!"

Đứng bên khung cửa sổ bệnh viện khi những tia nắng ban mai đầu tiên của ngày mới rọi sáng đường phố rực rỡ, Minh Quân khẽ thở phào nhẹ nhõm. Cuộc sống nơi đô hội đầy rẫy toan tính và áp lực, nhưng chính những khoảnh khắc cứu sống một sinh mệnh thế này mới là giá trị đích thực và vinh quang cao quý nhất trong cuộc hành trình của ${t}.`
    );
  } else if (g === 'khoa-huyen') {
    sections.push(
      `Biển sao vô tận trải rộng trước mắt trạm nghiên cứu viễn chinh Vọng Thiên như một tấm thảm nhung đen huyền bí cẩn hàng triệu viên ngọc viễn cổ phát sáng lấp lánh. Không gian chân không sâu thẳm ngoài quỹ đạo sao Hỏa chìm trong sự im lặng tuyệt đối của vũ trụ, nơi mà âm thanh không thể truyền tải, chỉ có tiếng kim loại rung rinh trầm trầm của hệ thống tuần hoàn trọng lực nhân tạo và tiếng rè rè êm dịu từ động cơ nhiệt hạch đa buồng đốt.

Bên trong buồng chỉ huy hình bán cầu bằng hợp kim Carbyne siêu bền, Thuyền trưởng Minh Quân đang đứng khoanh tay nhìn ra màn hình viễn vọng không gian ba chiều. Bên ngoài vòm kính cường lực, một xoáy bụi khí tinh vân màu tím lục khổng lồ trải dài hàng chục triệu cây số đang từ từ xoay chuyển theo quỹ đạo của một lỗ đen mini nhân tạo được tạo ra từ thời kỳ chiến tranh giữa các vì sao trăm năm trước.

— "Báo cáo thuyền trưởng, cảm biến bức xạ gamma vừa ghi nhận dao động dị thường tại tọa độ 88-Delta. Tần số dao động không tuân theo quy luật tự nhiên của sao xung, mà mang cấu trúc mã hóa lượng tử bậc mười sáu!" — Giọng nói trong trẻo nhưng đầy căng thẳng của Thiếu tá kỹ thuật Elena vang lên qua hệ thống truyền tin nội bộ.`
    );

    sections.push(
      `Minh Quân khẽ nhíu mày, ánh mắt sắc sảo lập tức dán chặt vào bảng điều khiển phân tích quang phổ:

— "Kích hoạt siêu máy tính lượng tử NOVA, tiến hành giải mã sóng hạ âm ngay lập tức! Đồng thời nâng lá chắn bức xạ photon lên cấp độ cao nhất!"

Trên màn hình toàn ảnh, trí tuệ nhân tạo NOVA hiển thị dưới dạng một quả cầu ánh sáng màu xanh ngọc bích, giọng nói điện tử tổng hợp cất lên với nhịp điệu dồn dập bất thường:

— "Cảnh báo khẩn cấp: Tín hiệu giải mã trùng khớp với bản ghi lưu trữ tối mật trong hồ sơ 'Hạt Giống Vũ Trụ' năm 2085. Nguồn phát tín hiệu đang di chuyển với tốc độ gấp ba lần vận tốc ánh sáng thông qua lỗ sâu không gian, khoảng cách tiếp cận ước tính chỉ còn ba trăm giây!"

Cả phòng điều khiển trong nháy mắt rơi vào trạng thái báo động chiến đấu đỏ. Toàn bộ đèn chiếu sáng chuyển sang màu đỏ rực, tiếng còi báo động khẩn cấp vang dội khắp các khoang thuyền sinh hoạt của hơn năm trăm phi hành gia và nhà khoa học.`
    );

    sections.push(
      `Bên ngoài không gian tối tăm, một vết nứt không-thời gian khổng lồ bỗng nhiên xé toạc chân không vũ trụ! Những tia sét plasma màu trắng bạc dài hàng trăm cây số chằng chịt rạch ngang màn đêm bao la. Từ bên trong vết rách không gian ấy, một khối cự thạch cơ khí hình kim tự tháp lơ lửng dài hơn năm mươi cây số chậm rãi trôi ra.

Bề mặt của khối kiến trúc vũ trụ ấy được bao phủ bởi những lớp phù điêu bằng kim loại lỏng không ngừng biến ảo hình dạng, phát ra ánh sáng huỳnh quang màu lam biếc cổ kính. Đó chính là tàn tích phi thuyền của nền văn minh Tiên Tộc đã biến mất bí ẩn khỏi dải Ngân Hà từ hàng tỷ năm trước, trước cả khi Trái Đất hình thành sự sống sơ khai!

— "Chúa ơi... nó không phải là một xác tàu chết! Hệ thống cảm biến sinh học phát hiện có hàng triệu khoang ấp trứng chứa mẫu gen sống đang bắt đầu khởi động chu trình rã đông!" — Elena thét lên kinh ngạc khi nhìn vào dữ liệu quét sâu vào lòng cấu trúc kim tự tháp.`
    );

    sections.push(
      `Đúng lúc đó, một chùm tia năng lượng hạt tích điện cực mạnh từ đỉnh kim tự tháp phóng thẳng về phía trạm Vọng Thiên! Trường lực phòng hộ plasma của trạm bị va đập dữ dội, còi báo động hư hỏng vỏ ngoài kêu inh ỏi, cả trạm nghiên cứu nặng hàng chục ngàn tấn rung lắc dữ dội như một chiếc lá giữa cơn cuồng phong.

— "Thuyền trưởng! Trường lực phòng hộ tụt xuống còn 35%! Nếu hứng chịu thêm một đợt xung kích nữa, lò phản ứng hạt nhân ở khoang B sẽ nổ tung!" — Trưởng ban phòng vệ hô to trong tuyệt vọng.

Đứng trước lằn ranh sinh tử của toàn bộ trạm không gian, Minh Quân vẫn giữ được sự bình tĩnh phi thường của một chỉ huy tối cao. Anh hít sâu một hơi, đưa bàn tay mang găng điều khiển thần kinh đặt thẳng lên bảng kích hoạt mã nguồn cấm:

— "NOVA, ngắt kết nối an toàn! Kích hoạt động cơ bẻ cong không gian Alcubierre! Chúng ta không chạy trốn, mà sẽ nhảy cóc không gian áp sát thẳng vào vùng mù radar của đỉnh kim tự tháp!"`
    );

    sections.push(
      `— "Tuân lệnh thuyền trưởng. Xác suất sống sót qua bước nhảy không gian tầm gần: 12.8%. Đếm ngược ba giây: Ba... Hai... Một... Bắt đầu bẻ cong không gian!"

Một tiếng rít chói tai vang lên khi không gian xung quanh trạm Vọng Thiên bị uốn cong thành một thấu kính hấp dẫn kỳ dị. Trong chớp mắt, trạm không gian biến mất khỏi vị trí cũ, bỏ lại chùm tia hủy diệt của kẻ thù bắn vào hư không.

Khoảnh khắc tiếp theo, trạm Vọng Thiên xuất hiện ngay sát sườn của cỗ máy khổng lồ, cách cánh cổng năng lượng của kim tự tháp chỉ vỏn vẹn vài trăm mét. Minh Quân lập tức khoác lên mình bộ giáp cơ giáp chiến đấu thế hệ thứ bảy mang tên 'Kình Thiên', tay nắm chặt khẩu súng trường hạt phản vật chất:

— "Đội đặc nhiệm Alpha, theo tôi đột nhập vào lõi trung tâm! Tương lai sinh tồn của loài người phụ thuộc vào trận chiến quyết định này!"`
    );

    sections.push(
      `Cánh cửa áp suất mở ra, những chiến binh cơ giáp dũng cảm lao mình vào khoảng không vũ trụ sâu thẳm, hướng thẳng vào trái tim của nền văn minh cổ đại đầy bí ẩn. Đằng sau họ là Trái Đất thân yêu đang bình yên say ngủ, và phía trước là bí mật tối hậu có thể thay đổi số phận của toàn thể vũ trụ trong kỷ nguyên ${t}...`
    );
  } else if (g === 'huyen-huyen') {
    sections.push(
      `Đại lục ma pháp Aethelgard ngập tràn trong ánh trăng máu kỳ dị treo lơ lửng trên nền trời xám xịt tựa tro tàn. Từng cơn gió lạnh buốt từ thung lũng Tử Thần thổi qua những phế tích đền đài ngàn năm đổ nát, mang theo mùi lưu huỳnh nồng nặc và tiếng gầm rú rợn người của những loài quái thú bóng đêm đang trỗi dậy sau giấc ngủ ngàn năm phong ấn.

Trên đỉnh tháp chuông rêu phong của pháo đài cổ Ravenclaw, một thiếu niên khoác áo choàng đen rách rưới đứng sừng sững giữa trời giông gió. Dưới mái tóc bạc trắng buông xõa là đôi mắt hai màu kỳ dị: một bên màu vàng kim rực lửa của loài Cự Long viễn cổ, một bên màu tím thẫm sâu thẳm của Hư Không ma pháp. Hai bàn tay hắn siết chặt thanh cự kiếm rỉ sét cắm sâu vào nền đá hoa cương, những đường gân xanh nơi cổ tay cuộn lên từng đợt chứa đựng thần lực kinh người.

Mười năm trước, khi phong ấn của Ma Thần cổ đại giáng xuống lãnh địa phương bắc, toàn bộ gia tộc hiệp sĩ rồng của hắn bị vu cáo là cấu kết với bóng tối, bị ngọn lửa thiêu đốt của giáo đình thiêu rụi sạch sẽ. Duy chỉ có hắn, kẻ mang trong mình dòng máu lai cấm kỵ giữa Thần tộc và Long tộc, được phong ấn ngủ vùi dưới lòng đất sâu, chịu đựng sự cô độc và thù hận suốt một thập kỷ đằng đẵng.`
    );

    sections.push(
      `— "Huyết mạch đã thức tỉnh, xiềng xích định mệnh rốt cuộc cũng đến ngày tan vỡ!" — Hắn khẽ gầm lên một tiếng trầm hùng, âm thanh vang dội tựa như tiếng sấm rền đánh thẳng vào linh hồn muôn loài sinh vật dưới chân núi.

Dưới lớp áo choàng đen, những hoa văn ma pháp cổ xưa hình vảy rồng trên ngực hắn bắt đầu phát ra ánh sáng chói lọi, thiêu đốt lớp da thịt thành những tinh thể kim cương lấp lánh. Trái tim rồng ngàn năm rực cháy như một mặt trời thu nhỏ, bơm dòng máu thần thánh sôi sục đi khắp kinh mạch toàn thân.

Bỗng nhiên, từ trong tầng mây đen đặc quánh trên bầu trời, hàng ngàn tiếng chim vỗ cánh dữ dội vang lên rợp trời rợp đất. Bầy Dơi Quỷ Huyết Nhãn khổng lồ sải cánh hơn mười trượng, mắt đỏ rực như hai hòn than cháy, mang theo nanh vuốt tẩm độc lao bổ xuống như một trận mưa tên đen kịt hướng thẳng về phía tháp chuông.`
    );

    sections.push(
      `Đi đầu bầy quỷ thú là một bóng người khổng lồ khoác giáp sắt đen tuyền, cưỡi trên lưng một đầu Cốt Long hai đầu dài hơn năm mươi mét. Đó chính là Kỵ Sĩ Hắc Ám Malakor, thủ lĩnh quân đoàn tử thần khét tiếng của Ma Giới. Hắn giơ cao cây thương vong linh tỏa ra khói đen kịt, cất tiếng cười khàn đục rung chuyển cả thung lũng:

— "Ha ha ha! Đứa con hoang của loài rồng viễn cổ, rốt cuộc cũng tìm thấy ngươi ở đây! Ma Thần đại nhân đã ban lệnh, mang đầu của ngươi cùng thanh Thần Khí Long Hồn về tế lễ, vương quốc bóng tối sẽ thống trị toàn bộ lục địa này!"

Hàng vạn mũi tên ma pháp đen kịt cùng làn sương độc lưu huỳnh trút xuống như thác lũ, bao trùm toàn bộ pháo đài Ravenclaw trong biển lửa tàn phá.`
    );

    sections.push(
      `Thiếu niên không hề nao núng, cánh tay phải khẽ chấn động, rút phăng thanh cự kiếm rỉ sét khỏi phiến đá. "Keng!" — Một tiếng ngân rền vang xé toạc màng nhĩ của bầy quỷ thú! Lớp rỉ sét bên ngoài thanh kiếm bong tróc rơi rụng, để lộ ra thân kiếm bằng hắc kim cổ đại khắc chín chữ Rune ma pháp phát ra ngọn lửa tử kim thiêu rụi không gian.

"Thần Kiếm Trảm Long — Bát Hoang Liệt Diễm!" — Hắn vung kiếm lên không trung, chú ngữ cấm kỵ viễn cổ tuôn trào theo từng nhịp đập của quả tim rồng.

Một luồng kiếm khí hình đầu rồng lửa khổng lồ dài nghìn trượng gầm thét phóng vút lên trời cao, ngọn lửa thiêng thiêu rụi toàn bộ làn sương độc và xé tan bầy dơi quỷ thành tro bụi chỉ trong nháy mắt. Cả bầu trời đêm rực sáng như ban ngày dưới ngọn lửa thiêng thần thánh!`
    );

    sections.push(
      `Malakor kinh hoàng gầm lên, thúc đầu Cốt Long phun ra một luồng băng sương tử khí lạnh thấu xương để ngăn cản kiếm khí, nhưng ngọn lửa rồng thần viễn cổ há lại là thứ mà ma thuật hắc ám có thể chống đỡ? Kiếm quang xuyên thủng đầu Cốt Long, chém đứt lìa một cánh tay của Kỵ Sĩ Hắc Ám khiến hắn rơi tự do xuống vực thẳm cùng tiếng thét kinh hoàng thất thanh.

Đứng giữa biển lửa thiêu rụi tàn tích quỷ dữ, thiếu niên từ từ giương đôi cánh rồng bằng ngọn lửa màu tử kim sau lưng. Đôi mắt hắn nhìn xa xăm về phía vương thành phương nam tráng lệ, nơi những kẻ phản bội năm xưa đang chìm trong yến tiệc xa hoa mà không hề hay biết rằng: Cơn thịnh nộ của Thần Long đã chính thức trở lại để đòi lại ngai vàng công lý trong truyền thuyết ${t}!`
    );
  } else {
    // Trinh thám
    sections.push(
      `Cơn mưa phùn rả rích kéo dài suốt ba ngày đêm phủ lên Cố đô Huế một tấm màn sương mờ mịt và u buồn. Nước sông Hương cuộn sóng đục ngầu, từng đợt sóng vỗ bì bõm vào những mạn thuyền nan neo đậu buồn bã bên bến Văn Lâu. Tiếng chuông chùa Thiên Mụ từng hồi ngân nga trầm buồn buông vào thinh không tĩnh mịch, hòa cùng tiếng gió rít qua những tán cây long não cổ thụ ven đường Lê Lợi.

Trong con ngõ sâu hun hút lát gạch vồ rêu phong của phường Kim Long, ngôi nhà rường cổ ba gian hai chái xây dựng từ thời vua Khải Định giờ đây bị phong tỏa nghiêm ngặt bởi những dải băng vàng của lực lượng kỹ thuật hình sự và cảnh sát điều tra tội phạm về trật tự xã hội. Ánh đèn pin công suất lớn quét qua từng góc tường rêu phong, soi rõ vẻ mặt căng thẳng tột độ của hàng chục điều tra viên dày dạn kinh nghiệm.

Nạn nhân là Giáo sư Trần Hữu Triết, một chuyên gia cổ học ngoài bảy mươi tuổi, người nắm giữ hàng trăm bí mật về các cổ vật quý giá của triều đình nhà Nguyễn. Thi thể ông được phát hiện vào sáng sớm nay trong tư thế ngồi ngay ngắn trên chiếc ghế bành bằng gỗ gụ chạm trổ hoa văn kỳ lân, đôi mắt mở trừng trừng nhìn vào bức hoành phi "Đức Lưu Quang" treo chính giữa gian thờ, hai bàn tay buông thõng, khóe miệng rỉ ra một vệt bọt mép màu xám tím kỳ lạ.`
    );

    sections.push(
      `— "Báo cáo Đại úy Nam, kết quả giám định pháp y sơ bộ tại hiện trường cho thấy nạn nhân tử vong vào khoảng giữa canh ba đêm qua, tức khoảng từ một đến hai giờ sáng, đúng thời điểm cơn giông to nhất đổ bộ vào thành phố." — Trung úy Tuấn, cán bộ pháp y trẻ tuổi vừa tỉ mỉ dùng nhíp gắp từng mẩu dị vật vừa báo cáo.

Đại úy Nam, điều tra viên kỳ cựu với hơn mười lăm năm phá các vụ trọng án hóc búa, khẽ cúi người xuống quan sát thi thể:

— "Có dấu hiệu giằng co, xô xát hay thương tích do ngoại lực tác động không?"

— "Hoàn toàn không, thưa đội trưởng. Quần áo nạn nhân phẳng phiu, các khớp xương không bị trật, không có dấu vết trói buộc hay bóp cổ. Nhưng điều kỳ lạ nhất nằm ở đây..." — Trung úy Tuấn chỉ tay vào chiếc chén sứ hoa lam đặt ngay ngắn trên bàn trà trước mặt nạn nhân: — "Chén trà này chứa một thứ độc dược cực hiếm chiết xuất từ rễ cây đoạn trường thảo kết hợp với nọc độc của loài rắn hổ mang chúa vùng rừng sâu Bạch Mã. Chỉ cần nửa giọt ngấm vào niêm mạc, nạn nhân sẽ ngừng tim trong vòng ba mươi giây mà không kịp phát ra bất kỳ tiếng kêu cứu nào!"`
    );

    sections.push(
      `Đại úy Nam bước chậm rãi quanh hiện trường, đôi mắt sắc sảo như đại bàng quan sát từng chi tiết nhỏ nhặt nhất. Ngôi nhà rường này có hệ thống cửa chốt cài bằng then gỗ lim kiên cố từ bên trong. Cửa chính và các cửa sổ phụ đều đóng chặt, hoàn toàn không có dấu vết cạy phá hay đột nhập từ bên ngoài.

Vậy hung thủ đã vào bằng cách nào? Và làm sao có thể khiến một vị giáo sư vốn cực kỳ cẩn trọng, đa nghi lại tự tay nâng chén trà độc lên uống một cách ung dung tự tại như vậy?

— "Trừ phi... kẻ đó là người cực kỳ thân quen, hoặc là người mà nạn nhân kính trọng đến mức không hề mảy may nảy sinh một chút đề phòng!" — Nam lẩm bẩm một mình, ánh mắt dừng lại ở chiếc giá sách cổ bằng gỗ mun phía sau lưng bàn làm việc.

Tại đó, một cuốn sách da cổ mang tên 'Đại Nam Điển Lệ' bị kéo lệch sang một bên, để lộ ra một khe hẹp bí mật phía sau vách tường gạch. Ngăn kéo bí mật đã bị mở toang, bên trong trống rỗng, chỉ còn lại một lớp bụi mỏng bị xáo trộn in hình một chiếc hộp hình chữ nhật dài chừng hai gang tay vừa mới bị lấy đi cách đây vài giờ.`
    );

    sections.push(
      `— "Đội trưởng! Mau lại đây xem!" — Tiếng gọi khẽ nhưng đầy vẻ khẩn cấp của nữ trinh sát viên Lan vang lên từ góc sân sau.

Nam lập tức sải bước ra hiên sau, nơi có một bể non bộ cổ kính trồng những cây tùng la hán trăm năm tuổi. Dưới cơn mưa phùn dai dẳng, trên nền đất thịt trơn trượt bên cạnh chân tường rào, một dấu giày thể thao cỡ 42 còn in hằn rõ nét. Đáng chú ý là bên cạnh dấu chân có vương vãi vài hạt phấn hoa mai vàng tươi tắn — loài hoa vốn chỉ nở vào dịp Tết cổ truyền, tuyệt nhiên không thể có mặt vào giữa mùa mưa tháng mười này!

— "Phấn hoa mai rừng nhân tạo... Đây chính là ký hiệu đặc trưng của tổ chức buôn bán cổ vật xuyên quốc gia mang bí danh 'Hoa Mai Các'!" — Nam siết chặt nắm tay, các khớp ngón tay kêu răng rắc. Vụ án mà anh theo đuổi suốt ba năm qua, tưởng chừng đã rơi vào ngõ cụt sau khi tên trùm cầm đầu trốn thoát ra nước ngoài, nay bỗng nhiên lại xuất hiện ngay giữa lòng Cố đô.`
    );

    sections.push(
      `Khi quay trở lại phòng khách để kiểm tra lại toàn bộ di vật của nạn nhân, Nam bỗng phát hiện dưới đáy chiếc gạt tàn thuốc bằng gốm sứ có một mẩu giấy than bị đốt cháy dở. Cẩn thận dùng kẹp gắp ra soi dưới ánh đèn cực tím, những dòng chữ số mật mã mờ nhạt dần dần hiện rõ:

"Kinh thành ngọc tỷ... Bản đồ mật thất dưới lăng vua Gia Long... Người mang chìa khóa là..."

Dòng chữ bị đứt đoạn ngay tại cái tên quyết định! Tiếng sấm rền từ phía biển Thuận An dội về rung chuyển cả bầu trời đêm Cố đô. Một bức màn âm mưu thâm hiểm liên quan đến kho báu hoàng gia và mạng lưới tội phạm tinh vi bắt đầu vén mở, đưa Đại úy Nam và các đồng đội bước vào một cuộc đấu trí sinh tử nghẹt thở trong vụ án chấn động mang tên ${t}...`
    );
  }

  return sections.join('\n\n');
}

export function generateAll50NovelsDeepData(): SeedNovel[] {
  return SEED_50_NOVELS.map((novel) => {
    const updatedChapters = novel.chapters.map((ch) => {
      const superLongContent = createSuperLongChapterV2(novel, ch.num, ch.title);
      return {
        num: ch.num,
        title: ch.title,
        content: superLongContent,
      };
    });

    return {
      ...novel,
      chapters: updatedChapters,
    };
  });
}

const allDeepNovels = generateAll50NovelsDeepData();
const targetPath = path.resolve('E:/CwAI/CwAI_Story/server/data/seed-novels.ts');

const fileHeader = `export interface SeedNovel {
  title: string;
  slug: string;
  author: string;
  genreSlug: string;
  cover: string;
  description: string;
  chapters: { num: number; title: string; content: string }[];
}

export const SEED_50_NOVELS: SeedNovel[] = `;

fs.writeFileSync(targetPath, fileHeader + JSON.stringify(allDeepNovels, null, 2) + ';\n', 'utf-8');
console.log(`Đã hoàn tất sinh nội dung siêu dài V2 cho toàn bộ ${allDeepNovels.length} bộ truyện!`);
